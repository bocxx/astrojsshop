#!/bin/bash

# Database Query Helper Script
# Usage: ./scripts/db-query.sh [command]

DB_NAME="foto_db"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if local or remote
LOCATION="--local"
if [ "$1" == "--remote" ]; then
    LOCATION="--remote"
    shift
fi

echo -e "${BLUE}📊 Database Query Tool${NC}"
echo -e "${YELLOW}Location: ${LOCATION}${NC}"
echo ""

# Function to execute query
execute_query() {
    npx wrangler d1 execute $DB_NAME $LOCATION --command="$1"
}

# Parse command
case "$1" in
    "users")
        echo -e "${GREEN}👥 All Users:${NC}"
        execute_query "SELECT id, email, name, CASE WHEN is_admin = 1 THEN '✅ Admin' ELSE '👤 User' END as role, datetime(created_at, 'unixepoch') as created FROM users ORDER BY is_admin DESC, created_at ASC"
        ;;

    "admins")
        echo -e "${GREEN}👑 Admin Users:${NC}"
        execute_query "SELECT email, name, datetime(created_at, 'unixepoch') as created FROM users WHERE is_admin = 1"
        ;;

    "photos")
        echo -e "${GREEN}📸 All Photos:${NC}"
        execute_query "SELECT id, name, description, CASE WHEN available = 1 THEN '✅ Available' ELSE '❌ Hidden' END as status FROM photos ORDER BY created_at DESC LIMIT 20"
        ;;

    "photo-count")
        echo -e "${GREEN}📊 Photo Statistics:${NC}"
        execute_query "SELECT COUNT(*) as total_photos, SUM(CASE WHEN available = 1 THEN 1 ELSE 0 END) as available_photos, SUM(CASE WHEN available = 0 THEN 1 ELSE 0 END) as hidden_photos FROM photos"
        ;;

    "orders")
        echo -e "${GREEN}🛒 Recent Orders:${NC}"
        execute_query "SELECT o.order_number, u.email, u.name, o.status, datetime(o.created_at, 'unixepoch') as created FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT 20"
        ;;

    "order-stats")
        echo -e "${GREEN}📊 Order Statistics:${NC}"
        execute_query "SELECT COUNT(*) as total_orders, SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed FROM orders"
        ;;

    "make-admin")
        if [ -z "$2" ]; then
            echo -e "${YELLOW}Usage: ./scripts/db-query.sh make-admin <email>${NC}"
            exit 1
        fi
        echo -e "${GREEN}👑 Making $2 an admin...${NC}"
        execute_query "UPDATE users SET is_admin = 1 WHERE email = '$2'"
        echo -e "${GREEN}✅ Done! Verifying...${NC}"
        execute_query "SELECT email, name, CASE WHEN is_admin = 1 THEN '✅ Admin' ELSE '👤 User' END as role FROM users WHERE email = '$2'"
        ;;

    "remove-admin")
        if [ -z "$2" ]; then
            echo -e "${YELLOW}Usage: ./scripts/db-query.sh remove-admin <email>${NC}"
            exit 1
        fi
        echo -e "${GREEN}👤 Removing admin rights from $2...${NC}"
        execute_query "UPDATE users SET is_admin = 0 WHERE email = '$2'"
        echo -e "${GREEN}✅ Done! Verifying...${NC}"
        execute_query "SELECT email, name, CASE WHEN is_admin = 1 THEN '✅ Admin' ELSE '👤 User' END as role FROM users WHERE email = '$2'"
        ;;

    "stats")
        echo -e "${GREEN}📊 Database Statistics:${NC}"
        execute_query "SELECT 'Users' as table_name, COUNT(*) as count FROM users UNION ALL SELECT 'Photos', COUNT(*) FROM photos UNION ALL SELECT 'Orders', COUNT(*) FROM orders UNION ALL SELECT 'Order Items', COUNT(*) FROM order_items"
        ;;

    "recent-activity")
        echo -e "${GREEN}🕐 Recent Activity (Last 24 hours):${NC}"
        execute_query "SELECT 'New User' as activity, email as details, datetime(created_at, 'unixepoch') as time FROM users WHERE created_at > unixepoch() - 86400 UNION ALL SELECT 'New Order', order_number, datetime(created_at, 'unixepoch') FROM orders WHERE created_at > unixepoch() - 86400 ORDER BY time DESC"
        ;;

    "custom")
        if [ -z "$2" ]; then
            echo -e "${YELLOW}Usage: ./scripts/db-query.sh custom 'SELECT * FROM users'${NC}"
            exit 1
        fi
        echo -e "${GREEN}🔧 Custom Query:${NC}"
        execute_query "$2"
        ;;

    "help"|"")
        echo -e "${GREEN}Available commands:${NC}"
        echo ""
        echo -e "  ${BLUE}users${NC}            - List all users"
        echo -e "  ${BLUE}admins${NC}           - List admin users"
        echo -e "  ${BLUE}photos${NC}           - List all photos (last 20)"
        echo -e "  ${BLUE}photo-count${NC}      - Photo statistics"
        echo -e "  ${BLUE}orders${NC}           - List recent orders"
        echo -e "  ${BLUE}order-stats${NC}      - Order statistics"
        echo -e "  ${BLUE}make-admin <email>${NC} - Make user an admin"
        echo -e "  ${BLUE}remove-admin <email>${NC} - Remove admin rights"
        echo -e "  ${BLUE}stats${NC}            - Database statistics"
        echo -e "  ${BLUE}recent-activity${NC}  - Recent activity (24h)"
        echo -e "  ${BLUE}custom <query>${NC}   - Execute custom SQL query"
        echo ""
        echo -e "${YELLOW}Examples:${NC}"
        echo -e "  ./scripts/db-query.sh users"
        echo -e "  ./scripts/db-query.sh make-admin user@example.com"
        echo -e "  ./scripts/db-query.sh --remote users  ${YELLOW}(query remote database)${NC}"
        echo -e "  ./scripts/db-query.sh custom 'SELECT COUNT(*) FROM photos'"
        ;;

    *)
        echo -e "${YELLOW}Unknown command: $1${NC}"
        echo -e "Run './scripts/db-query.sh help' for available commands"
        exit 1
        ;;
esac
