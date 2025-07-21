# Database Migration Guide: Appwrite to PostgreSQL/MySQL

This guide will help you migrate your CRMS V2 application from Appwrite to PostgreSQL or MySQL.

## 🚀 Quick Start

### 1. Install Database Dependencies

The database dependencies have already been added to your `package.json`:

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# Database Provider Selection
# Options: 'postgresql', 'mysql', 'appwrite'
EXPO_PUBLIC_DATABASE_PROVIDER=postgresql

# PostgreSQL Configuration (if using PostgreSQL)
EXPO_PUBLIC_POSTGRES_HOST=localhost
EXPO_PUBLIC_POSTGRES_PORT=5432
EXPO_PUBLIC_POSTGRES_DB=crms_db
EXPO_PUBLIC_POSTGRES_USER=postgres
EXPO_PUBLIC_POSTGRES_PASSWORD=your_password_here

# MySQL Configuration (if using MySQL)
EXPO_PUBLIC_MYSQL_HOST=localhost
EXPO_PUBLIC_MYSQL_PORT=3306
EXPO_PUBLIC_MYSQL_DB=crms_db
EXPO_PUBLIC_MYSQL_USER=root
EXPO_PUBLIC_MYSQL_PASSWORD=your_password_here

# Appwrite Configuration (legacy - kept for backward compatibility)
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://syd.cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=crms-project
EXPO_PUBLIC_APPWRITE_DATABASE_ID=crms-app-db
EXPO_PUBLIC_APPWRITE_COLLECTION_ID=students
```

### 3. Initialize Database

#### For PostgreSQL:
```bash
npm run init-db
```

#### For MySQL:
```bash
npm run init-db-mysql
```

This will:
- Create all 30 tables from your schema
- Set up proper indexes for performance
- Insert default roles and sample data
- Test the database connection

### 4. Test the Migration

Start your application:

```bash
npm start
```

The application will now use your selected database instead of Appwrite!

## 📊 Database Schema Overview

Your database includes 30 tables organized into 8 categories:

### 1. School Settings (5 tables)
- `departments` - Academic departments
- `programs` - Degree programs
- `program_specializations` - Program specializations
- `school_terms` - Academic terms
- `sections` - Class sections

### 2. Users & Roles (5 tables)
- `roles` - User roles (admin, dean, faculty, etc.)
- `users` - User accounts
- `user_approvals` - User approval workflow
- `students` - Student records
- `user_profiles` - Extended user profiles

### 3. Courses & Enrollments (4 tables)
- `courses` - Course catalog
- `section_courses` - Course sections with instructors
- `course_enrollments` - Student enrollments
- `course_enrollment_requests` - Enrollment change requests

### 4. Syllabi & ILOs (3 tables)
- `syllabi` - Course syllabi
- `ilos` - Intended Learning Outcomes
- `syllabus_ilos` - Syllabus-ILO relationships

### 5. Assessments & Grading (6 tables)
- `assessments` - Course assessments
- `rubrics` - Assessment rubrics
- `assessment_rubrics` - Assessment-rubric relationships
- `submissions` - Student submissions
- `rubric_scores` - Individual rubric scores
- `course_final_grades` - Final course grades

### 6. Attendance & Analytics (3 tables)
- `attendance_logs` - Student attendance
- `analytics_clusters` - Student performance clusters
- `dashboards_data_cache` - Cached dashboard data

### 7. ILO Tracking (2 tables)
- `assessment_ilo_weights` - Assessment weights for ILOs
- `student_ilo_scores` - Student ILO achievement scores

### 8. Notifications & Files (2 tables)
- `notifications` - User notifications
- `uploads` - File uploads

## 🔄 Migration Features

### Seamless Interface
The migration maintains the same API interface as your Appwrite implementation:

```javascript
// These work the same way with Appwrite, PostgreSQL, and MySQL
import { studentsDB, syllabiDB, coursesDB } from '../utils/database';

// List documents
const students = await studentsDB.listDocuments();

// Create document
const newStudent = await studentsDB.createDocument(studentData);

// Update document
const updatedStudent = await studentsDB.updateDocument(id, updateData);

// Delete document
await studentsDB.deleteDocument(id);
```

### Provider Switching
You can easily switch between databases by changing the environment variable:

```env
# Use PostgreSQL
EXPO_PUBLIC_DATABASE_PROVIDER=postgresql

# Use MySQL
EXPO_PUBLIC_DATABASE_PROVIDER=mysql

# Use Appwrite (legacy)
EXPO_PUBLIC_DATABASE_PROVIDER=appwrite
```

### Performance Optimizations
Both PostgreSQL and MySQL implementations include:
- Connection pooling (20 max connections)
- Query optimization
- Proper indexing (80+ indexes)
- Caching layer (same as Appwrite)
- Performance monitoring

## 🛠️ Advanced Configuration

### PostgreSQL Settings

You can customize the PostgreSQL connection in `utils/postgresql.js`:

```javascript
const config = {
  host: process.env.EXPO_PUBLIC_POSTGRES_HOST || 'localhost',
  port: process.env.EXPO_PUBLIC_POSTGRES_PORT || 5432,
  database: process.env.EXPO_PUBLIC_POSTGRES_DB || 'crms_db',
  user: process.env.EXPO_PUBLIC_POSTGRES_USER || 'postgres',
  password: process.env.EXPO_PUBLIC_POSTGRES_PASSWORD || '',
  max: 20, // Maximum connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};
```

### MySQL Settings

You can customize the MySQL connection in `utils/mysql.js`:

```javascript
const config = {
  host: process.env.EXPO_PUBLIC_MYSQL_HOST || 'localhost',
  port: process.env.EXPO_PUBLIC_MYSQL_PORT || 3306,
  database: process.env.EXPO_PUBLIC_MYSQL_DB || 'crms_db',
  user: process.env.EXPO_PUBLIC_MYSQL_USER || 'root',
  password: process.env.EXPO_PUBLIC_MYSQL_PASSWORD || '',
  charset: 'utf8mb4',
  collation: 'utf8mb4_unicode_ci',
  connectionLimit: 20,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};
```

### Database Health Check

Test your database connection:

```javascript
import { healthCheck } from '../utils/database';

const health = await healthCheck();
console.log(health);
// Output: { provider: 'postgresql', connected: true, timestamp: '...' }
```

## 🔧 Troubleshooting

### Common Issues

1. **Connection Refused**
   - Ensure your database server is running
   - Check host and port settings
   - Verify firewall settings

2. **Authentication Failed**
   - Check username and password
   - Ensure user has proper permissions
   - Verify database exists

3. **Table Not Found**
   - Run `npm run init-db` (PostgreSQL) or `npm run init-db-mysql` (MySQL)
   - Check database name in configuration

### Debug Mode

Enable detailed logging by adding to your `.env`:

```env
EXPO_PUBLIC_DEBUG=true
```

## 📈 Performance Considerations

### Indexes
The database includes optimized indexes for:
- Student number lookups
- User email searches
- Course code queries
- Enrollment relationships
- And 70+ more indexes for optimal performance

### Connection Pooling
- Maximum 20 concurrent connections
- Automatic connection cleanup
- Connection timeout handling

### Caching
- 5-minute cache duration
- Automatic cache invalidation
- Memory-efficient storage

## 🗄️ Database Comparison

| Feature | PostgreSQL | MySQL | Appwrite |
|---------|------------|-------|----------|
| **Performance** | Excellent | Very Good | Good |
| **Scalability** | Excellent | Very Good | Limited |
| **ACID Compliance** | Full | Full | Partial |
| **JSON Support** | Native JSONB | JSON | Native |
| **Full-Text Search** | Excellent | Good | Basic |
| **Cost** | Free/Paid | Free/Paid | Subscription |
| **Setup Complexity** | Medium | Easy | Very Easy |

## 🔮 Future Enhancements

### Data Migration Tools
Future versions will include:
- Automated data migration from Appwrite
- Data validation tools
- Rollback capabilities

### Advanced Features
- Real-time notifications
- Advanced analytics
- Backup and restore tools

## 📞 Support

If you encounter issues during migration:

1. Check the console logs for detailed error messages
2. Verify your database installation and configuration
3. Ensure all environment variables are set correctly
4. Run the database initialization script again if needed

The migration maintains full backward compatibility, so you can always switch back to Appwrite if needed.

## 🎯 Recommended Setup

For production use, we recommend:

- **PostgreSQL** for enterprise applications requiring advanced features
- **MySQL** for simpler applications or when you're more familiar with it
- **Appwrite** for rapid prototyping or small-scale applications 