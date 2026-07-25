# Sample Data Documentation

## Step 2 Complete: Sample Data Created

### Summary of Data Created

✅ **28 Students** across all years and sections  
✅ **28 Parents** with contact details  
✅ **4 Message Templates** in English and Tamil  
✅ **1 Staff Assignment** with all classes assigned  

---

## 📊 Student Distribution

### Second Year - CSE A (10 students)
| Register # | Name | Parent Mobile |
|---|---|---|
| 24CS001 | Abdul Rasheed | 9876543210 |
| 24CS002 | Kumar Jayavelu | 9876543211 |
| 24CS003 | Ravi Chandran | 9876543212 |
| 24CS004 | Arun Kumar | 9876543213 |
| 24CS005 | Bharath S | 9876543214 |
| 24CS006 | Chitra R | 9876543215 |
| 24CS007 | Deepika M | 9876543216 |
| 24CS008 | Ezhil Arasan | 9876543217 |
| 24CS009 | Fancy B | 9876543218 |
| 24CS010 | Ganesh K | 9876543219 |

### Second Year - CSE B (5 students)
| Register # | Name | Parent Mobile |
|---|---|---|
| 24CS101 | Harini V | 9876543220 |
| 24CS102 | Isha Sharma | 9876543221 |
| 24CS103 | Jasmine T | 9876543222 |
| 24CS104 | Karthik P | 9876543223 |
| 24CS105 | Lakshmi N | 9876543224 |

### Third Year - CSE A (5 students)
| Register # | Name | Parent Mobile |
|---|---|---|
| 23CS001 | Mani R | 9876543225 |
| 23CS002 | Nisha D | 9876543226 |
| 23CS003 | Omkar S | 9876543227 |
| 23CS004 | Priya K | 9876543228 |
| 23CS005 | Qasim A | 9876543229 |

### Third Year - CSE B (3 students)
| Register # | Name | Parent Mobile |
|---|---|---|
| 23CS101 | Rajesh V | 9876543230 |
| 23CS102 | Sneha P | 9876543231 |
| 23CS103 | Tanvi M | 9876543232 |

### Final Year - CSE A (3 students)
| Register # | Name | Parent Mobile |
|---|---|---|
| 22CS001 | Uday Kumar | 9876543233 |
| 22CS002 | Varun A | 9876543234 |
| 22CS003 | Waqar Khan | 9876543235 |

### Final Year - CSE B (2 students)
| Register # | Name | Parent Mobile |
|---|---|---|
| 22CS101 | Xavier D | 9876543236 |
| 22CS102 | Yuki Tanaka | 9876543237 |

---

## 👨‍👩‍👧‍👦 Parent Information

Each student has **one parent** linked with:
- **Name**: Full name
- **Relationship**: Father/Mother/Guardian
- **Mobile Number**: 10-digit number (9876543XXX)
- **WhatsApp Number**: Same as mobile (all enabled)
- **Email**: corresponding Gmail address

All mobile numbers are in the format: `9876543XXX` (for testing)  
All WhatsApp numbers are the same as mobile numbers

---

## 📝 Message Templates

### 1. **Absence Notification** (Default)
**Type**: Absence  
**Status**: Active & Default  

**English Template**:
```
Dear Parents,

Your Son/Daughter [Student Name] has not attended the college today ([Date]).

Please contact the college if you have any concerns.

Regards,
CSE Department
King's College of Engineering
```

**Tamil Template**:
```
அன்புள்ள பெற்றோர்களே,

உங்கள் மகன்/மகள் [மாணவர் பெயர்] இன்று ([தேதி]) கல்லூரிக்கு வரவில்லை.

ஏதேனும் சந்தேகம் இருந்தால் கல்லூரிக்கு தொடர்பு கொள்க.

வணக்கம்,
CSE பிரிவு
கிங்ஸ் கல்லூரி ஆஸ்தான
```

**Placeholders**:
- `[Student Name]` - Auto-filled with student's name
- `[Date]` - Auto-filled with attendance date

---

### 2. **Multiple Absence Notification**
**Type**: Absence  
**Status**: Active  

**English Template**:
```
Dear Parents,

We notice that your ward [Student Name] has been absent for [Number] days in the past [Period].

Kindly ensure regular attendance as per college regulations.

Regards,
CSE Department
```

**Tamil Template**:
```
அன்புள்ள பெற்றோர்களே,

உங்கள் மாணவர் [மாணவர் பெயர்] கடந்த [காலம்] நாட்களில் [எண்] நாட்கள் வரவில்லை என்பதை நாம் கவனிக்கிறோம்.

கல்லூரி விதிகளுக்கு ஏற்ப தொடர்ந்து வருமாறு கேட்டுக் கொள்கிறோம்.

வணக்கம்,
CSE பிரிவு
```

**Placeholders**:
- `[Student Name]` - Student name
- `[Number]` - Number of absences
- `[Period]` - Time period (e.g., "last week")

---

### 3. **Perfect Attendance Award**
**Type**: Attendance  
**Status**: Active  

**English Template**:
```
Congratulations!

Your ward [Student Name] has maintained perfect attendance this month.

Keep up the excellent work!

Regards,
CSE Department
```

**Tamil Template**:
```
வாழ்த்துக்கள்!

உங்கள் மாணவர் [மாணவர் பெயர்] இந்த மாதம் சரியான வருகை பராமரித்துள்ளார்.

இந்த சிறந்த செயல்பாட்டை தொடர்ந்து வைக்கவும்!

வணக்கம்,
CSE பிரிவு
```

**Placeholders**:
- `[Student Name]` - Student name

---

### 4. **Low Performance Alert**
**Type**: Performance  
**Status**: Active  

**English Template**:
```
Dear Parents,

We would like to inform you that [Student Name] is showing low performance in academics.

Please schedule a meeting with the department to discuss this matter.

Regards,
CSE Department
```

**Tamil Template**:
```
அன்புள்ள பெற்றோர்களே,

[மாணவர் பெயர்] கல்வியில் குறைந்த செயல்பாட்டை காட்டுகிறார் என்பதை நாம் உங்களுக்கு தெரிவிக்க விரும்புகிறோம்.

இந்த விஷயத்தை விவாதிக்க பிரிவுடன் சந்திப்பு நேரமாக நிர்ணயிக்கவும்.

வணக்கம்,
CSE பிரிவு
```

**Placeholders**:
- `[Student Name]` - Student name

---

## 👨‍🏫 Staff Assignment

**Assigned to**: `staff_cse` (Username: staff_cse)

**Classes Assigned**:
- Academic Year 2026-2027
  - Second Year - CSE A
  - Second Year - CSE B
  - Third Year - CSE A
  - Third Year - CSE B
  - Final Year - CSE A
  - Final Year - CSE B

**Department**: CSE

---

## 🔐 Login Credentials

### HOD Access
- **Username**: `hod_cse`
- **Password**: `HOD@2026`
- **Role**: HOD
- **Access**: Can view dashboards, monitoring, reports

### Staff Access
- **Username**: `staff_cse`
- **Password**: `Staff@2026`
- **Role**: Staff
- **Access**: Can mark attendance, submit messages

---

## 💾 How to Re-seed Data

If you want to clear and re-seed the sample data:

```bash
npm run seed-data
```

This will:
1. Clear all existing students, parents, templates, and assignments
2. Create 28 new students
3. Create 28 new parents
4. Link each student to their parent
5. Create 4 message templates
6. Assign all classes to the staff member

---

## ✅ Ready for Testing

The system now has:
- ✅ Real student data to work with
- ✅ Parent contact information
- ✅ Pre-configured message templates (English + Tamil)
- ✅ Staff assigned to classes
- ✅ Ready for attendance marking
- ✅ Ready for message sending

### Next Steps After Sample Data

1. **Mark Attendance**: Staff can mark students present/absent
2. **Send Messages**: System identifies absent students and sends SMS/WhatsApp
3. **Track Status**: HOD can monitor message delivery
4. **View Reports**: Access attendance and message history

---

## 📌 Data Relationships

```
Staff (staff_cse)
    ↓
StaffAssignment (assigned to all classes)
    ↓
Attendance (marked for each class/date)
    ├── Student 1: Present
    ├── Student 2: Absent ← Triggers Message
    │   └── Parent: 9876543XXX
    │       ├── SMS
    │       └── WhatsApp
    └── Student 3: Present
```

---

## 🔄 Data Management

### Running Seed Script
```bash
# Terminal 1: Start backend dev server
npm run dev

# Terminal 2: Create users (HOD and Staff)
npm run create-users

# Terminal 3: Seed sample data
npm run seed-data
```

All scripts are idempotent and safe to run multiple times.

