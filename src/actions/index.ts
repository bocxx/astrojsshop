import { ActionError, defineAction } from 'astro:actions';
import { Resend } from 'resend';
import { z } from 'zod';
import { PhotoDB } from '../lib/db';

export const server = {
  register: defineAction({
    accept: 'form',
    input: z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().min(2),
    }),
    handler: async ({ email, password, name }, context) => {
      const db = new PhotoDB(
        context.locals.runtime.env.DB,
        context.locals.runtime.env.PHOTOS
      );

      try {
        const user = await db.createUser(email, password, name);

        // Set session cookie
        context.cookies.set('user_id', user.id, {
          path: '/',
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 1 week
        });

        return { success: true, user };
      } catch (error: any) {
        if (error.message?.includes('UNIQUE')) {
          throw new ActionError({
            code: 'CONFLICT',
            message: 'Email already in use',
          });
        }
        throw error;
      }
    },
  }),

  login: defineAction({
    accept: 'form',
    input: z.object({
      email: z.string().email(),
      password: z.string(),
    }),
    handler: async ({ email, password }, context) => {
      const db = new PhotoDB(
        context.locals.runtime.env.DB,
        context.locals.runtime.env.PHOTOS
      );
      const user = await db.authenticateUser(email, password);

      if (!user) {
        throw new ActionError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        });
      }

      context.cookies.set('user_id', user.id, {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      });

      return { success: true };
    },
  }),

  logout: defineAction({
    accept: 'json',
    handler: async (_, context) => {
      context.cookies.delete('user_id', {
        path: '/',
      });
      return { success: true };
    },
  }),

  placeOrder: defineAction({
    accept: 'json',
    input: z.object({
      items: z
        .array(
          z.object({
            photoId: z.string(),
            photoName: z.string(),
            quantity: z.number().positive().default(1),
          })
        )
        .min(1),
    }),
    handler: async ({ items }, context) => {
      if (!context.locals.user) {
        throw new ActionError({
          code: 'UNAUTHORIZED',
          message: 'Not logged in',
        });
      }

      const db = new PhotoDB(
        context.locals.runtime.env.DB,
        context.locals.runtime.env.PHOTOS
      );
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      const order = await db.createOrder(context.locals.user.id, orderNumber);
      await db.addOrderItems(order.id, items);

      // Send email notification to admin
      const apiKey = context.locals.runtime.env.RESEND_API_KEY;
      const adminEmail = context.locals.runtime.env.ADMIN_EMAIL;

      console.log('🔑 RESEND_API_KEY aanwezig:', !!apiKey);
      console.log('📧 ADMIN_EMAIL:', adminEmail);

      if (!apiKey) {
        console.error('⚠️ RESEND_API_KEY niet gevonden in environment variables');
        return { success: true, orderNumber, emailSent: false };
      }

      if (!adminEmail) {
        console.error('⚠️ ADMIN_EMAIL niet gevonden in environment variables');
        return { success: true, orderNumber, emailSent: false };
      }

      const resend = new Resend(apiKey);

      // Create HTML list of items
      const itemsListHtml = items
        .map((i) => `<li><strong>${i.photoName}</strong> - Aantal: ${i.quantity}</li>`)
        .join('');

      const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

      try {
        // Admin notification email
        console.log('📤 Versturen admin email naar:', adminEmail);
        const adminResult = await resend.emails.send({
          from: 'onboarding@resend.dev',
          to: adminEmail,
          subject: `📸 Nieuwe Foto Bestelling: ${orderNumber}`,
          html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #0066cc; color: white; padding: 20px; text-align: center; }
                .content { background: #f9f9f9; padding: 20px; }
                .order-details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #0066cc; }
                .photo-list { list-style: none; padding: 0; }
                .photo-list li { padding: 8px; border-bottom: 1px solid #eee; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎉 Nieuwe Foto Bestelling!</h1>
                </div>
                <div class="content">
                  <div class="order-details">
                    <h2>Bestellingsinformatie</h2>
                    <p><strong>Bestelnummer:</strong> ${orderNumber}</p>
                    <p><strong>Datum:</strong> ${new Date().toLocaleString('nl-NL')}</p>
                    <p><strong>Totaal Aantal:</strong> ${totalItems}</p>
                  </div>

                  <div class="order-details">
                    <h2>Klantgegevens</h2>
                    <p><strong>Naam:</strong> ${context.locals.user.name}</p>
                    <p><strong>Email:</strong> ${context.locals.user.email}</p>
                  </div>

                  <div class="order-details">
                    <h2>Bestelde Foto's</h2>
                    <ul class="photo-list">
                      ${itemsListHtml}
                    </ul>
                  </div>

                  <p><strong>Actie Vereist:</strong> Bereid deze foto's voor en stuur ze naar ${context.locals.user.email}</p>
                </div>
                <div class="footer">
                  <p>Foto Bestel Systeem - Geautomatiseerde Notificatie</p>
                </div>
              </div>
            </body>
          </html>
        `,
        });
        console.log('✅ Admin email verzonden:', adminResult);

        // Customer confirmation email
        console.log('📤 Versturen klant email naar:', context.locals.user.email);
        const customerResult = await resend.emails.send({
          from: 'onboarding@resend.dev',
          to: context.locals.user.email,
          subject: `✅ Bestellingsbevestiging: ${orderNumber}`,
          html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #28a745; color: white; padding: 20px; text-align: center; }
                .content { background: #f9f9f9; padding: 20px; }
                .order-summary { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #28a745; }
                .photo-list { list-style: none; padding: 0; }
                .photo-list li { padding: 8px; border-bottom: 1px solid #eee; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>✅ Bestelling Bevestigd!</h1>
                </div>
                <div class="content">
                  <p>Hoi <strong>${context.locals.user.name}</strong>,</p>
                  <p>Bedankt voor je bestelling! We hebben je aanvraag ontvangen en zullen deze binnenkort verwerken.</p>

                  <div class="order-summary">
                    <h2>Jouw Bestellingsoverzicht</h2>
                    <p><strong>Bestelnummer:</strong> ${orderNumber}</p>
                    <p><strong>Datum:</strong> ${new Date().toLocaleString('nl-NL')}</p>
                    <p><strong>Totaal Aantal:</strong> ${totalItems}</p>
                  </div>

                  <div class="order-summary">
                    <h2>Bestelde Foto's</h2>
                    <ul class="photo-list">
                      ${itemsListHtml}
                    </ul>
                  </div>

                  <p><strong>Wat Nu?</strong></p>
                  <p>We bereiden je foto's voor en sturen ze naar <strong>${context.locals.user.email}</strong> zodra ze klaar zijn.</p>

                  <p>Als je vragen hebt, aarzel dan niet om te antwoorden op deze email.</p>

                  <p>Met vriendelijke groet,<br>Het Foto Team</p>
                </div>
                <div class="footer">
                  <p>Dit is een geautomatiseerde bevestigingsmail</p>
                </div>
              </div>
            </body>
          </html>
        `,
        });
        console.log('✅ Klant email verzonden:', customerResult);

        return { success: true, orderNumber, emailSent: true };
      } catch (emailError: any) {
        console.error('❌ Email fout:', emailError);
        console.error('❌ Email fout details:', JSON.stringify(emailError, null, 2));
        // Order is still created, just email failed
        return { success: true, orderNumber, emailSent: false, emailError: emailError.message };
      }
    },
  }),

  updateOrderStatus: defineAction({
    accept: 'json',
    input: z.object({
      orderId: z.string(),
      newStatus: z.enum(['pending', 'completed', 'processing']),
    }),
    handler: async ({ orderId, newStatus }, context) => {
      if (!context.locals.user || !context.locals.user.is_admin) {
        throw new ActionError({
          code: 'UNAUTHORIZED',
          message: 'Admin access required',
        });
      }

      const db = context.locals.runtime.env.DB;

      await db
        .prepare('UPDATE orders SET status = ? WHERE id = ?')
        .bind(newStatus, orderId)
        .run();

      return { success: true, newStatus };
    },
  }),

  resendOrderEmail: defineAction({
    accept: 'json',
    input: z.object({
      orderId: z.string(),
    }),
    handler: async ({ orderId }, context) => {
      if (!context.locals.user || !context.locals.user.is_admin) {
        throw new ActionError({
          code: 'UNAUTHORIZED',
          message: 'Admin access required',
        });
      }

      const db = new PhotoDB(
        context.locals.runtime.env.DB,
        context.locals.runtime.env.PHOTOS
      );

      // Get order details
      const order = await db.getOrderById(orderId) as any;

      if (!order) {
        throw new ActionError({
          code: 'NOT_FOUND',
          message: 'Order not found',
        });
      }

      const resend = new Resend(context.locals.runtime.env.RESEND_API_KEY);

      // Create HTML list of items
      const itemsListHtml = order.items
        .map((i: any) => `<li><strong>${i.photo_name}</strong> - Aantal: ${i.quantity}</li>`)
        .join('');

      const totalItems = order.items.reduce((sum: number, i: any) => sum + i.quantity, 0);

      // Resend admin notification email
      await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: context.locals.runtime.env.ADMIN_EMAIL,
        subject: `📸 [OPNIEUW VERZONDEN] Foto Bestelling: ${order.order_number}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #0066cc; color: white; padding: 20px; text-align: center; }
                .resent-badge { background: #ffa500; padding: 5px 10px; border-radius: 5px; font-size: 12px; }
                .content { background: #f9f9f9; padding: 20px; }
                .order-details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #0066cc; }
                .photo-list { list-style: none; padding: 0; }
                .photo-list li { padding: 8px; border-bottom: 1px solid #eee; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎉 Foto Bestelling <span class="resent-badge">OPNIEUW VERZONDEN</span></h1>
                </div>
                <div class="content">
                  <div class="order-details">
                    <h2>Bestellingsinformatie</h2>
                    <p><strong>Bestelnummer:</strong> ${order.order_number}</p>
                    <p><strong>Originele Datum:</strong> ${new Date(order.created_at * 1000).toLocaleString('nl-NL')}</p>
                    <p><strong>Opnieuw Verzonden:</strong> ${new Date().toLocaleString('nl-NL')}</p>
                    <p><strong>Totaal Aantal:</strong> ${totalItems}</p>
                  </div>

                  <div class="order-details">
                    <h2>Klantgegevens</h2>
                    <p><strong>Naam:</strong> ${order.user_name}</p>
                    <p><strong>Email:</strong> ${order.email}</p>
                  </div>

                  <div class="order-details">
                    <h2>Bestelde Foto's</h2>
                    <ul class="photo-list">
                      ${itemsListHtml}
                    </ul>
                  </div>

                  <p><strong>Actie Vereist:</strong> Bereid deze foto's voor en stuur ze naar ${order.email}</p>
                </div>
                <div class="footer">
                  <p>Foto Bestel Systeem - Opnieuw Verzonden Notificatie</p>
                </div>
              </div>
            </body>
          </html>
        `,
      });

      // Resend customer confirmation email
      await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: order.email,
        subject: `✅ [HERINNERING] Bestellingsbevestiging: ${order.order_number}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #28a745; color: white; padding: 20px; text-align: center; }
                .reminder-badge { background: #ffa500; padding: 5px 10px; border-radius: 5px; font-size: 12px; }
                .content { background: #f9f9f9; padding: 20px; }
                .order-summary { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #28a745; }
                .photo-list { list-style: none; padding: 0; }
                .photo-list li { padding: 8px; border-bottom: 1px solid #eee; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>✅ Bestelling Herinnering <span class="reminder-badge">OPNIEUW VERZONDEN</span></h1>
                </div>
                <div class="content">
                  <p>Hoi <strong>${order.user_name}</strong>,</p>
                  <p>Dit is een herinnering voor je foto bestelling. We zijn je aanvraag nog aan het verwerken!</p>

                  <div class="order-summary">
                    <h2>Jouw Bestellingsoverzicht</h2>
                    <p><strong>Bestelnummer:</strong> ${order.order_number}</p>
                    <p><strong>Originele Datum:</strong> ${new Date(order.created_at * 1000).toLocaleString('nl-NL')}</p>
                    <p><strong>Totaal Aantal:</strong> ${totalItems}</p>
                  </div>

                  <div class="order-summary">
                    <h2>Bestelde Foto's</h2>
                    <ul class="photo-list">
                      ${itemsListHtml}
                    </ul>
                  </div>

                  <p>Als je vragen hebt, aarzel dan niet om te antwoorden op deze email.</p>

                  <p>Met vriendelijke groet,<br>Het Foto Team</p>
                </div>
                <div class="footer">
                  <p>Dit is een opnieuw verzonden bevestigingsmail</p>
                </div>
              </div>
            </body>
          </html>
        `,
      });

      return { success: true, orderNumber: order.order_number };
    },
  }),
};
