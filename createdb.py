from sqlalchemy import text
from database import engine

def update_device_table():
    with engine.connect() as connection:
        # Thay đổi kiểu dữ liệu của ip_address thành VARCHAR(20) nếu là inet
        connection.execute(text("""
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'devices' AND column_name = 'ip_address' 
                    AND data_type = 'inet'
                ) THEN
                    ALTER TABLE devices 
                    ALTER COLUMN ip_address TYPE VARCHAR(20) USING ip_address::text;
                END IF;
            END $$;
        """))
        
        # Thêm các cột cần thiết nếu chưa tồn tại
        connection.execute(text("""
            ALTER TABLE devices
            ADD COLUMN IF NOT EXISTS port VARCHAR(10),
            ADD COLUMN IF NOT EXISTS connection_type VARCHAR(20),
            ADD COLUMN IF NOT EXISTS username VARCHAR(50),
            ADD COLUMN IF NOT EXISTS password_hash TEXT,
            ADD COLUMN IF NOT EXISTS device_type VARCHAR(50) DEFAULT 'NodeMCU',
            ADD COLUMN IF NOT EXISTS location VARCHAR(100),
            ADD COLUMN IF NOT EXISTS controlled_feature VARCHAR(100),
            ADD COLUMN IF NOT EXISTS private_key TEXT,
            ADD COLUMN IF NOT EXISTS owner_id INTEGER,
            ADD COLUMN IF NOT EXISTS device_group_id INTEGER,
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        """))
        
        # Thêm ràng buộc UNIQUE cho username
        connection.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'devices_username_key'
                ) THEN
                    ALTER TABLE devices ADD CONSTRAINT devices_username_key UNIQUE (username);
                END IF;
            END $$;
        """))
        
        # Thêm khóa ngoại cho owner_id và device_group_id
        connection.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'fk_devices_owner'
                ) THEN
                    ALTER TABLE devices 
                    ADD CONSTRAINT fk_devices_owner
                    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;
                END IF;
            END $$;
        """))
        
        connection.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'fk_devices_device_group'
                ) THEN
                    ALTER TABLE devices 
                    ADD CONSTRAINT fk_devices_device_group
                    FOREIGN KEY (device_group_id) REFERENCES device_groups(id) ON DELETE CASCADE;
                END IF;
            END $$;
        """))
        
        # Điền giá trị mặc định cho các cột NULL
        connection.execute(text("""
            UPDATE devices 
            SET port = '22',
                connection_type = 'SSH',
                username = 'device_' || id,
                password_hash = 'default_hash',
                device_type = COALESCE(device_type, 'NodeMCU'),
                controlled_feature = COALESCE(controlled_feature, 'Default'),
                private_key = 'default_key',
                owner_id = COALESCE(owner_id, (SELECT MIN(id) FROM users WHERE id IS NOT NULL)),
                device_group_id = COALESCE(device_group_id, (SELECT MIN(id) FROM device_groups WHERE id IS NOT NULL))
            WHERE port IS NULL 
               OR connection_type IS NULL 
               OR username IS NULL 
               OR password_hash IS NULL 
               OR controlled_feature IS NULL
               OR private_key IS NULL 
               OR owner_id IS NULL 
               OR device_group_id IS NULL;
        """))
        
        # Thiết lập các cột thành NOT NULL
        connection.execute(text("""
            ALTER TABLE devices
            ALTER COLUMN ip_address SET NOT NULL,
            ALTER COLUMN port SET NOT NULL,
            ALTER COLUMN connection_type SET NOT NULL,
            ALTER COLUMN username SET NOT NULL,
            ALTER COLUMN password_hash SET NOT NULL,
            ALTER COLUMN controlled_feature SET NOT NULL,
            ALTER COLUMN private_key SET NOT NULL,
            ALTER COLUMN owner_id SET NOT NULL,
            ALTER COLUMN device_group_id SET NOT NULL;
        """))
        
        connection.commit()
        print("Cập nhật bảng devices thành công!")

if __name__ == "__main__":
    update_device_table()