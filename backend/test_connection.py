import os
from dotenv import load_dotenv
import psycopg2
from psycopg2 import sql
import sys

# Load environment variables
load_dotenv()

# Get database credentials
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "2025")
DB_NAME = os.getenv("DB_NAME", "postgres")

print("\n" + "=" * 60)
print("🔍 TESTING POSTGRESQL CONNECTION")
print("=" * 60)
print(f"📍 Host: {DB_HOST}")
print(f"🔌 Port: {DB_PORT}")
print(f"👤 User: {DB_USER}")
print(f"🗄️  Database: {DB_NAME}")
print(f"🔑 Password: {'*' * len(DB_PASSWORD)}")
print("=" * 60 + "\n")

try:
    print("⏳ Attempting to connect to PostgreSQL...\n")
    
    # Test 1: Connect to PostgreSQL
    connection = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME
    )
    
    cursor = connection.cursor()
    
    print("✅ TEST 1: Connection established successfully!\n")
    
    # Test 2: Get PostgreSQL version
    print("⏳ Checking PostgreSQL version...")
    cursor.execute("SELECT version();")
    db_version = cursor.fetchone()
    print(f"✅ TEST 2: PostgreSQL Version")
    print(f"   {db_version[0]}\n")
    
    # Test 3: Check current database
    print("⏳ Verifying current database...")
    cursor.execute("SELECT current_database();")
    current_db = cursor.fetchone()
    print(f"✅ TEST 3: Current Database Confirmed")
    print(f"   Database: {current_db[0]}\n")
    
    # Test 4: Check user privileges
    print("⏳ Checking user privileges...")
    cursor.execute("""
        SELECT 
            grantee, 
            string_agg(privilege_type, ', ') as privileges
        FROM information_schema.table_privileges
        WHERE grantee = %s
        GROUP BY grantee
        LIMIT 1
    """, (DB_USER,))
    privileges = cursor.fetchone()
    if privileges:
        print(f"✅ TEST 4: User Privileges Verified")
        print(f"   User: {privileges[0]}")
        print(f"   Privileges: {privileges[1]}\n")
    else:
        print(f"✅ TEST 4: User privileges check complete\n")
    
    # Test 5: List all tables in the database
    print("⏳ Checking existing tables...")
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
    """)
    tables = cursor.fetchall()
    print(f"✅ TEST 5: Database Tables")
    if tables:
        print(f"   Found {len(tables)} table(s):")
        for table in tables:
            print(f"   📋 {table[0]}")
    else:
        print("   📋 No tables yet (ready for new schema)")
    print()
    
    # Test 6: Test write access by creating a test table
    print("⏳ Testing WRITE access (creating test table)...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cardiosense_connection_test (
            id SERIAL PRIMARY KEY,
            test_message VARCHAR(255),
            test_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    connection.commit()
    print("✅ TEST 6: Write Access Confirmed")
    print("   ✓ Test table created successfully\n")
    
    # Test 7: Insert test data
    print("⏳ Testing INSERT operation...")
    cursor.execute("""
        INSERT INTO cardiosense_connection_test (test_message) 
        VALUES (%s) 
        RETURNING id, test_message, test_timestamp
    """, ("Connection test successful from Cardio-Sense backend!",))
    test_record = cursor.fetchone()
    connection.commit()
    print(f"✅ TEST 7: INSERT Operation Successful")
    print(f"   Record ID: {test_record[0]}")
    print(f"   Message: {test_record[1]}")
    print(f"   Timestamp: {test_record[2]}\n")
    
    # Test 8: Read test data
    print("⏳ Testing READ operation...")
    cursor.execute("""
        SELECT id, test_message, test_timestamp 
        FROM cardiosense_connection_test 
        ORDER BY id DESC 
        LIMIT 1
    """)
    result = cursor.fetchone()
    print(f"✅ TEST 8: READ Operation Successful")
    print(f"   Retrieved Record:")
    print(f"   - ID: {result[0]}")
    print(f"   - Message: {result[1]}")
    print(f"   - Timestamp: {result[2]}\n")
    
    # Test 9: Update test data
    print("⏳ Testing UPDATE operation...")
    cursor.execute("""
        UPDATE cardiosense_connection_test 
        SET test_message = %s 
        WHERE id = %s
        RETURNING id, test_message
    """, ("Connection verified and updated!", result[0]))
    updated = cursor.fetchone()
    connection.commit()
    print(f"✅ TEST 9: UPDATE Operation Successful")
    print(f"   Updated record ID {updated[0]}")
    print(f"   New message: {updated[1]}\n")
    
    # Test 10: Delete test data and clean up
    print("⏳ Testing DELETE operation and cleanup...")
    cursor.execute("DELETE FROM cardiosense_connection_test")
    deleted_count = cursor.rowcount
    cursor.execute("DROP TABLE cardiosense_connection_test")
    connection.commit()
    print(f"✅ TEST 10: DELETE Operation Successful")
    print(f"   Deleted {deleted_count} record(s)")
    print(f"   Test table removed\n")
    
    # Close connection
    cursor.close()
    connection.close()
    
    print("=" * 60)
    print("🎉 ALL TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)
    print("\n✅ Connection Summary:")
    print(f"   ✓ PostgreSQL is running and accessible")
    print(f"   ✓ Credentials are valid")
    print(f"   ✓ Database '{DB_NAME}' is accessible")
    print(f"   ✓ Full READ/WRITE permissions confirmed")
    print(f"   ✓ All CRUD operations working correctly")
    print("\n🚀 You're ready to build the Cardio-Sense backend!")
    print("   Next steps:")
    print("   1. Create database models")
    print("   2. Set up migrations")
    print("   3. Implement API endpoints")
    print("=" * 60 + "\n")
    
    sys.exit(0)
    
except psycopg2.OperationalError as error:
    print("\n❌ CONNECTION FAILED!")
    print("=" * 60)
    print(f"Error Type: Operational Error")
    print(f"Details: {error}\n")
    print("🔧 Troubleshooting Steps:")
    print("   1. ✓ Check if PostgreSQL service is running")
    print("      - Open Services (services.msc)")
    print("      - Look for 'postgresql' service")
    print("   2. ✓ Verify credentials in pgAdmin")
    print("   3. ✓ Ensure database 'postgres' exists")
    print("   4. ✓ Check if port 5432 is not blocked")
    print("=" * 60 + "\n")
    sys.exit(1)
    
except psycopg2.DatabaseError as error:
    print("\n❌ DATABASE ERROR!")
    print("=" * 60)
    print(f"Error Type: Database Error")
    print(f"Details: {error}\n")
    print("🔧 Troubleshooting Steps:")
    print("   1. ✓ Verify database name is correct")
    print("   2. ✓ Check user permissions")
    print("   3. ✓ Review PostgreSQL logs")
    print("=" * 60 + "\n")
    sys.exit(1)
    
except Exception as error:
    print("\n❌ UNEXPECTED ERROR!")
    print("=" * 60)
    print(f"Error Type: {type(error).__name__}")
    print(f"Details: {error}")
    print("=" * 60 + "\n")
    sys.exit(1)
