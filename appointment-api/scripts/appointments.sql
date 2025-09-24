USE AppointmentsDb;
GO

DECLARE @tableName NVARCHAR(256)
DECLARE table_cursor CURSOR FOR
SELECT table_name
FROM information_schema.tables
WHERE table_type = 'BASE TABLE'

OPEN table_cursor
FETCH NEXT FROM table_cursor INTO @tableName

WHILE @@FETCH_STATUS = 0
BEGIN
    DECLARE @sql NVARCHAR(MAX)
    SET @sql = 'SELECT * FROM [' + @tableName + ']'
    EXEC(@sql)
    FETCH NEXT FROM table_cursor INTO @tableName
END

CLOSE table_cursor
DEALLOCATE table_cursor
GO
