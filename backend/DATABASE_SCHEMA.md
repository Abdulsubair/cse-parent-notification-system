# Database Schema Documentation

## Step 1 Complete: Database Models Created

### Models Overview

#### 1. **User Model** (`models/User.js`)
- Stores staff and HOD login credentials
- Fields:
  - `name`: Full name of the user
  - `username`: Unique username for login
  - `password`: Hashed password
  - `role`: Either "hod" or "staff"
  - `isActive`: Account status
  - `timestamps`: Created and updated dates

#### 2. **Student Model** (`models/Student.js`)
- Stores student information
- Fields:
  - `registerNumber`: Unique student ID (e.g., 23CS001)
  - `name`: Student full name
  - `email`: Student email
  - `phone`: Contact number
  - `year`: Second/Third/Final Year
  - `section`: CSE A or CSE B
  - `parentId`: Reference to Parent model
  - `isActive`: Student status
  - `timestamps`: Created and updated dates

#### 3. **Parent Model** (`models/Parent.js`)
- Stores parent/guardian contact information
- Fields:
  - `name`: Parent full name
  - `relationship`: Father/Mother/Guardian
  - `mobileNumber`: 10-digit mobile number
  - `whatsappNumber`: WhatsApp-enabled number
  - `email`: Email address
  - `students`: Array of references to Student model (one parent can have multiple children)
  - `isActive`: Parent status
  - `timestamps`: Created and updated dates

#### 4. **Attendance Model** (`models/Attendance.js`)
- Records attendance for an entire class on a specific date
- Fields:
  - `date`: Date of attendance
  - `academicYear`: Current academic year
  - `year`: Second/Third/Final Year
  - `section`: CSE A or CSE B
  - `staffId`: Reference to staff who marked attendance
  - `records`: Array of attendance records for each student
    - `studentId`: Reference to student
    - `status`: Present or Absent
  - `messagesSent`: Whether messages were sent for absences
  - `messageSubmittedAt`: When messages were submitted
  - `isActive`: Record status
  - `timestamps`: Created and updated dates

#### 5. **MessageLog Model** (`models/MessageLog.js`)
- Tracks SMS and WhatsApp messages separately for each absent student
- Fields:
  - `attendanceId`: Reference to Attendance record
  - `studentId`: Reference to Student
  - `parentId`: Reference to Parent
  - `messageTemplate`: Message in English and Tamil
  - `sms`: SMS channel details
    - `status`: PENDING, SENT, DELIVERED, FAILED
    - `mobileNumber`: Recipient number
    - `messageId`: Provider's message ID
    - `error`: Error message if failed
    - `sentAt`: When sent
    - `deliveredAt`: When delivered
  - `whatsapp`: WhatsApp channel details
    - `status`: PENDING, SENT, DELIVERED, READ, FAILED
    - `whatsappNumber`: Recipient number
    - `messageId`: Provider's message ID
    - `error`: Error message if failed
    - `sentAt`: When sent
    - `deliveredAt`: When delivered
    - `readAt`: When read
  - `overallStatus`: PENDING, SUCCESS (both succeeded), PARTIAL (one succeeded), FAILED
  - `date`: Message date
  - `year/section`: Class information
  - `isActive`: Record status
  - `timestamps`: Created and updated dates

#### 6. **MessageTemplate Model** (`models/MessageTemplate.js`)
- Stores reusable message templates in English and Tamil
- Fields:
  - `name`: Template name (e.g., "Absence Notification")
  - `description`: Template description
  - `english`: Message in English
  - `tamil`: Message in Tamil
  - `placeholders`: Variables in messages (e.g., [Student Name])
  - `type`: Absence, Attendance, Performance, General
  - `isActive`: Template status
  - `isDefault`: Whether this is the default template
  - `timestamps`: Created and updated dates

#### 7. **StaffAssignment Model** (`models/StaffAssignment.js`)
- Tracks which staff members are assigned to which classes
- Fields:
  - `userId`: Reference to User (staff member)
  - `assignedClasses`: Array of class assignments
    - `academicYear`: Academic year
    - `year`: Second/Third/Final Year
    - `section`: CSE A or CSE B
  - `department`: Department (CSE)
  - `isActive`: Assignment status
  - `timestamps`: Created and updated dates

### Database Relationship Diagram

```
User (Staff/HOD)
├── has many: Attendance (staffId)
└── has one: StaffAssignment (userId)

Attendance
├── references: User (staffId)
├── has many: MessageLog (attendanceId)
└── has many: Student records

Student
├── references: Parent (parentId)
└── has many: MessageLog (studentId)

Parent
├── has many: Student (students array)
└── has many: MessageLog (parentId)

MessageLog
├── references: Attendance (attendanceId)
├── references: Student (studentId)
└── references: Parent (parentId)

MessageTemplate
└── stores message patterns for MessageLog
```

### Configuration Constants (`config/constants.js`)

Centralized system configuration:
- Academic Years: 2023-2024 to 2026-2027
- Years: Second, Third, Fourth
- Sections: CSE A, CSE B
- Roles: HOD, Staff
- Message Types: Absence, Attendance, Performance, General
- Statuses for SMS, WhatsApp, and Messages
- Current Academic Year: 2026-2027

### Next Steps

✅ **Step 1 Complete**: Database Models Created
- All models are in `/backend/models/`
- Models are exported from `/backend/models/index.js`
- System constants configured in `/backend/config/constants.js`
- All file references updated

⏭️ **Step 2**: Create sample data (students, parents, message templates)

The database schema is now ready for:
- Student and parent data import
- Attendance tracking
- Message logging with separate SMS/WhatsApp status tracking
- HOD dashboard queries

