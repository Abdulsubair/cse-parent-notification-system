const { MessageLog } = require("../models");
const axios = require("axios");

const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY;

/**
 * Format date into DD-MM-YYYY for SMS body
 */
const formatDate = (dateVal) => {
  let d;
  if (!dateVal) {
    d = new Date();
  } else if (dateVal instanceof Date) {
    d = dateVal;
  } else {
    d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
  }
  const day   = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year  = d.getFullYear();
  return `${day}-${month}-${year}`;
};

/**
 * Build the dual-language (English + Tamil) SMS body for an absent student
 */
const renderDualMessage = (studentName, gender, dateInput) => {
  const formattedDate = formatDate(dateInput);
  let childTerm = "son/daughter";
  if (gender === "Male")   childTerm = "son";
  if (gender === "Female") childTerm = "daughter";

  const english = `Dear Parent, your ${childTerm} ${studentName} (CSE Dept) is absent for college today, ${formattedDate}. Please contact the CSE Head of Department (HOD) immediately. – Kings College of Engineering.`;
  const tamil   = `அன்புள்ள பெற்றோருக்கு, உங்கள் பிள்ளை ${studentName} (கணினி அறிவியல் துறை) இன்று (${formattedDate}) கல்லூரிக்கு வரவில்லை. உடனடியாக துறைத் தலைவரை (HOD) தொடர்பு கொள்ளவும். – கிங்ஸ் பொறியியல் கல்லூரி`;
  const combined = `${english}\n\n${tamil}`;
  return { english, tamil, combined };
};

/**
 * Send SMS via Fast2SMS API (https://www.fast2sms.com)
 * Uses the Quick SMS route — supports Unicode (Tamil) messages.
 */
const sendSms = async (mobileNumber, message) => {
  if (!mobileNumber) {
    return { status: "FAILED", error: "Missing parent mobile number" };
  }

  if (!FAST2SMS_API_KEY) {
    console.error("FAST2SMS_API_KEY is not set in .env");
    return { status: "FAILED", error: "FAST2SMS_API_KEY not configured" };
  }

  const cleanedNumber = String(mobileNumber).replace(/\D/g, "").slice(-10);

  if (cleanedNumber.length !== 10) {
    return {
      status: "FAILED",
      mobileNumber: cleanedNumber,
      error: `Invalid 10-digit mobile number: ${mobileNumber}`,
    };
  }

  // Detect if message contains Tamil (Unicode) characters
  const isUnicode = /[\u0B80-\u0BFF]/.test(message);
  const language  = isUnicode ? "unicode" : "english";

  console.log(`📲 Sending SMS via Fast2SMS to ${cleanedNumber} [${language}]`);

  try {
    const response = await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      {
        route:    "q",           // Quick SMS route
        message:  message,
        language: language,
        flash:    0,
        numbers:  cleanedNumber,
      },
      {
        headers: {
          authorization: FAST2SMS_API_KEY,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );

    console.log("Fast2SMS response:", response.data);

    if (response.data && response.data.return === true) {
      const messageId =
        response.data.request_id ||
        (Array.isArray(response.data.message) ? response.data.message[0] : null) ||
        `F2SMS_${Date.now()}`;

      console.log(`✅ SMS sent successfully. Request ID: ${messageId}`);
      return {
        status:      "SENT",
        mobileNumber: cleanedNumber,
        messageId:   messageId,
        sentAt:      new Date(),
      };
    }

    // Fast2SMS returned an error response
    const errorMsg = Array.isArray(response.data?.message)
      ? response.data.message.join(", ")
      : response.data?.message || "Fast2SMS request failed";

    console.error("❌ Fast2SMS error:", errorMsg);
    return {
      status:      "FAILED",
      mobileNumber: cleanedNumber,
      error:       errorMsg,
    };
  } catch (error) {
    const errDetails = error.response?.data || error.message;
    console.error("❌ Fast2SMS API exception:", errDetails);
    return {
      status:      "FAILED",
      mobileNumber: cleanedNumber,
      error: typeof errDetails === "object" ? JSON.stringify(errDetails) : errDetails,
    };
  }
};

/**
 * Called by attendanceRoutes.js after attendance is submitted.
 * Automatically sends SMS to every absent student's parent via Fast2SMS.
 * WhatsApp is disabled — SMS only.
 */
const sendAbsenceNotifications = async ({ attendance, absentRecords, students }) => {
  const studentMap = new Map();
  students.forEach((s) => studentMap.set(s._id.toString(), s));

  const logs = [];

  for (const record of absentRecords) {
    const student     = studentMap.get(record.studentId.toString());
    const parent      = student?.parentId;
    const studentName = student?.name   || "Student";
    const gender      = student?.gender || "Male";

    const { english, tamil, combined } = renderDualMessage(
      studentName,
      gender,
      attendance?.date
    );

    // Send SMS automatically via Fast2SMS
    const smsResult = await sendSms(
      parent?.mobileNumber || parent?.phone,
      combined
    );

    console.log(`SMS → ${smsResult.mobileNumber}: ${smsResult.status}`);

    logs.push({
      attendanceId: attendance._id,
      studentId:    student?._id,
      parentId:     parent?._id,
      messageTemplate: { english, tamil },
      sms: {
        status:      smsResult.status,
        mobileNumber: smsResult.mobileNumber || parent?.mobileNumber || parent?.phone || null,
        messageId:   smsResult.messageId  || null,
        error:       smsResult.error      || null,
        sentAt:      smsResult.sentAt     || new Date(),
        deliveredAt: new Date(),
      },
      whatsapp: {
        status:         "DISABLED",
        whatsappNumber: null,
        messageId:      null,
        error:          null,
        sentAt:         new Date(),
        deliveredAt:    new Date(),
      },
      overallStatus: ["SENT", "DELIVERED"].includes(smsResult.status) ? "SUCCESS" : "FAILED",
      date:          attendance.date,
      year:          attendance.year,
      section:       attendance.section,
    });
  }

  const createdLogs = await MessageLog.insertMany(logs);

  const successCount = createdLogs.filter((l) => l.overallStatus === "SUCCESS").length;
  console.log(`📊 SMS summary: ${successCount}/${createdLogs.length} sent successfully`);

  return {
    total:        createdLogs.length,
    successCount: successCount,
    failedCount:  createdLogs.length - successCount,
    logs:         createdLogs,
  };
};

module.exports = {
  renderDualMessage,
  sendAbsenceNotifications,
  sendSms,
};
