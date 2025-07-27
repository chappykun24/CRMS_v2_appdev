const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'crms_v2_db',
  password: 'care0924',
  port: 5432,
});

async function createAttendanceData() {
  const client = await pool.connect();
  
  try {
    console.log('📊 Creating Attendance Data...');
    
    // Step 1: Get existing students and their enrollments
    console.log('👥 Fetching students and enrollments...');
    const studentsQuery = `
      SELECT 
        s.student_id,
        s.full_name,
        s.student_number,
        ce.enrollment_id,
        ce.section_course_id
      FROM students s
      JOIN course_enrollments ce ON s.student_id = ce.student_id
      WHERE ce.status = 'enrolled'
      ORDER BY s.full_name
    `;
    
    const studentsResult = await client.query(studentsQuery);
    const students = studentsResult.rows;
    
    console.log(`📈 Found ${students.length} enrolled students`);
    
    if (students.length === 0) {
      console.log('❌ No enrolled students found. Please create students and enrollments first.');
      return;
    }
    
    // Step 2: Get or create sessions for each section course
    console.log('📅 Creating sessions for courses...');
    const sectionCourses = [...new Set(students.map(s => s.section_course_id))];
    
    const sessions = [];
    for (const sectionCourseId of sectionCourses) {
      // Create 10 sessions for each course (2 sessions per week for 5 weeks)
      for (let week = 1; week <= 5; week++) {
        for (let session = 1; session <= 2; session++) {
          const sessionDate = new Date();
          sessionDate.setDate(sessionDate.getDate() + (week - 1) * 7 + (session - 1) * 3); // Monday and Thursday
          
          const sessionTitle = `Week ${week} - Session ${session}`;
          const sessionType = session === 1 ? 'Lecture' : 'Laboratory';
          const meetingType = session === 1 ? 'Face-to-Face' : 'Online';
          
          try {
            const insertSessionQuery = `
              INSERT INTO sessions (
                section_course_id, title, session_type, meeting_type, session_date, created_at
              ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
              RETURNING session_id
            `;
            
            const sessionResult = await client.query(insertSessionQuery, [
              sectionCourseId,
              sessionTitle,
              sessionType,
              meetingType,
              sessionDate.toISOString().split('T')[0]
            ]);
            
            sessions.push({
              session_id: sessionResult.rows[0].session_id,
              section_course_id: sectionCourseId,
              title: sessionTitle,
              session_date: sessionDate.toISOString().split('T')[0]
            });
            
          } catch (error) {
            if (error.code === '23505') { // Unique constraint violation
              console.log(`Session already exists for ${sessionTitle}`);
            } else {
              console.error(`Error creating session: ${error.message}`);
            }
          }
        }
      }
    }
    
    console.log(`📅 Created ${sessions.length} sessions`);
    
    // Step 3: Generate attendance records for each student and session
    console.log('📝 Generating attendance records...');
    
    let totalAttendanceRecords = 0;
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let excuseCount = 0;
    
    for (const student of students) {
      const studentSessions = sessions.filter(s => s.section_course_id === student.section_course_id);
      
      for (const session of studentSessions) {
        // Generate attendance status with realistic probabilities
        const random = Math.random();
        let status, remarks;
        
        if (random < 0.85) {
          // 85% chance of being present
          status = 'present';
          remarks = null;
          presentCount++;
        } else if (random < 0.92) {
          // 7% chance of being absent
          status = 'absent';
          remarks = 'No excuse provided';
          absentCount++;
        } else if (random < 0.96) {
          // 4% chance of being late
          status = 'late';
          remarks = 'Arrived 15 minutes late';
          lateCount++;
        } else {
          // 4% chance of having an excuse
          status = 'excuse';
          const excuses = [
            'Medical appointment',
            'Family emergency',
            'Transportation issue',
            'Academic conference',
            'Sports competition'
          ];
          remarks = excuses[Math.floor(Math.random() * excuses.length)];
          excuseCount++;
        }
        
        // Record attendance
        try {
          const insertAttendanceQuery = `
            INSERT INTO attendance_logs (
              enrollment_id, session_id, status, session_date, recorded_at, remarks
            ) VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (enrollment_id, session_id) DO NOTHING
          `;
          
          const recordedAt = new Date(session.session_date);
          recordedAt.setHours(8 + Math.floor(Math.random() * 4)); // Random time between 8 AM and 12 PM
          recordedAt.setMinutes(Math.floor(Math.random() * 60));
          
          await client.query(insertAttendanceQuery, [
            student.enrollment_id,
            session.session_id,
            status,
            session.session_date,
            recordedAt.toISOString(),
            remarks
          ]);
          
          totalAttendanceRecords++;
          
        } catch (error) {
          if (error.code !== '23505') { // Ignore unique constraint violations
            console.error(`Error creating attendance record: ${error.message}`);
          }
        }
      }
    }
    
    // Step 4: Generate attendance statistics
    console.log('\n📊 Attendance Data Summary:');
    console.log(`📈 Total attendance records created: ${totalAttendanceRecords}`);
    console.log(`✅ Present: ${presentCount} (${((presentCount/totalAttendanceRecords)*100).toFixed(1)}%)`);
    console.log(`❌ Absent: ${absentCount} (${((absentCount/totalAttendanceRecords)*100).toFixed(1)}%)`);
    console.log(`⏰ Late: ${lateCount} (${((lateCount/totalAttendanceRecords)*100).toFixed(1)}%)`);
    console.log(`📋 Excuse: ${excuseCount} (${((excuseCount/totalAttendanceRecords)*100).toFixed(1)}%)`);
    
    // Step 5: Verify attendance data
    console.log('\n🔍 Verifying attendance data...');
    const verificationQuery = `
      SELECT 
        COUNT(*) as total_records,
        COUNT(CASE WHEN status = 'present' THEN 1 END) as present_count,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_count,
        COUNT(CASE WHEN status = 'late' THEN 1 END) as late_count,
        COUNT(CASE WHEN status = 'excuse' THEN 1 END) as excuse_count
      FROM attendance_logs
    `;
    
    const verificationResult = await client.query(verificationQuery);
    const stats = verificationResult.rows[0];
    
    console.log('✅ Verification Results:');
    console.log(`   Total records in database: ${stats.total_records}`);
    console.log(`   Present: ${stats.present_count}`);
    console.log(`   Absent: ${stats.absent_count}`);
    console.log(`   Late: ${stats.late_count}`);
    console.log(`   Excuse: ${stats.excuse_count}`);
    
    // Step 6: Show sample attendance records
    console.log('\n📋 Sample Attendance Records:');
    const sampleQuery = `
      SELECT 
        s.full_name,
        s.student_number,
        ses.title as session_title,
        al.status,
        al.session_date,
        al.remarks
      FROM attendance_logs al
      JOIN course_enrollments ce ON al.enrollment_id = ce.enrollment_id
      JOIN students s ON ce.student_id = s.student_id
      JOIN sessions ses ON al.session_id = ses.session_id
      ORDER BY s.full_name, al.session_date
      LIMIT 10
    `;
    
    const sampleResult = await client.query(sampleQuery);
    sampleResult.rows.forEach((record, index) => {
      console.log(`   ${index + 1}. ${record.full_name} - ${record.session_title} - ${record.status.toUpperCase()}`);
      if (record.remarks) {
        console.log(`      Remarks: ${record.remarks}`);
      }
    });
    
    console.log('\n🎉 Attendance data creation completed successfully!');
    console.log('📱 You can now view attendance data in the Attendance Management section.');
    
  } catch (error) {
    console.error('❌ Error creating attendance data:', error);
  } finally {
    client.release();
  }
}

// Run the attendance data creation
createAttendanceData()
  .then(() => {
    console.log('🎉 Attendance data creation process completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }); 