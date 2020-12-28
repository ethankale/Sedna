Sedna
=====
An environmental database for high-rate data, individual data points, and everything in between.

Many of the design decisions for this database were inspired by the paper [Towards a water quality database for raw and validated data with emphasis on structured metadata](https://iwaponline.com/wqrj/article/54/1/1/64706/Towards-a-water-quality-database-for-raw-and).

Getting Started
---------------
To install the application:

1. Get access to an MSSQL instance (2012 or above).  You can install the Express version on your desktop from <https://www.microsoft.com/en-us/sql-server/sql-server-downloads>.
2. Install SQL Server Management Studio (SSMS).  Download from <https://docs.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms?view=sql-server-ver15>.
3. Open a new Query window in SSMS and run the database install/setup scripts in the following order:
    1. ./src/sql/schema.sql
    2. ./src/sql/load_from_gdata.sql (optional, if you're migrating from GData.  Only works if the GData database is on the same server as the Sedna database)
    3. ./src/sql/indexes.sql
4. Use SSMS to set up a user with read/write access on the newly created database.  
    1. This user can't use the windows login; it has to use a password login.
    2. Enable TCP connections for the server in the SQL Server Configuration Manager.  See <https://stackoverflow.com/questions/2388042/connect-to-sql-server-2008-with-tcp-ip>.
    3. Enable SQL Server logins; by default it only allows Windows connections.  See <https://stackoverflow.com/questions/11625899/cannot-login-after-creating-the-user-in-sql-server>.
5. Download and install the program.  The latest stable version is in [Releases](https://github.com/ethankale/Sedna/releases).
6. Open the program, immediate go to settings, and put in the SQL Server info for the DB and the user you created.

That should do it.  Most likely issue is with the user; make sure the user you create & use has permission to read, write, and delete for every table in the database.

Development
-----------
You'll need Node 12 and NPM 6.  On Windows, highly recommended you start by installing [git bash](https://git-scm.com), if you haven't already.  

1. Pull the project into a new directory with git.  
2. `npm install` to install all the dependencies. 
3. `npm run build` to execute webpack and bundle the javascript code.  
4. `npm start` to run the Electron app. 
5. `npm run make` to create an Electron project.

### Naming Conventions
#### SQL
Tables are singular.  So are columns.  Pascal casing (all first words upper, no spaces or underscores).  Many-to-many tables include the names of both tables.  Dtm means datetime.  IDs get unique names (unique throughout the database).  Foreign key columns have the exact same name as the primary key of the joined table.  No prefixes or suffixes on tables or columns.  The following suffixes on other things:
* _v View (with the main TableName in front, of course)
* _fk Foreign Key (the constraint name, not the column name)
* _cac Cache
* _seg Segment
* _tr Transaction (stored proc or function)
* _fn Function (non-transactional), etc.

Mostly this is cribbed from <https://stackoverflow.com/questions/4702728/relational-table-naming-convention/4703155#4703155>.
By convention, names are varchar(100), and descriptions are varchar(255).

#### Vue
VueJS components are translated into valid HTML and back.  HTML doesn't recognize cases, so CamelCase is not great.  For components we've been using just flatvariablenames, which isn't great.  Kebob-case is a possible alternative, but not how we're doing things right now.