const { MessageLog } = require("../models");
const axios = require("axios");

// ─────────────────────────────────────────────────────────────────────────────
// Android SMS Gateway Configuration
//
// HOW TO SET UP (100% FREE — uses your Android phone's SIM card):
//
//   1. Install "Android SMS Gateway" from Play Store on a college Android phone:
//      https://play.google.com/store/apps/details?id=me.capcom.smsgateway
//
//   2. Open the app → tap the power button to START the server.
//      The app shows your phone's local IP address and port (e.g. http://192.168.1.5:8080).
//
//   3. Note the login credentials shown in the app (default: admin / admin).
//
//   4. Set these in your backend/.env file:
//      ANDROID_SMS_GATEWAY_URL=http://192.168.1.5:8080
//      ANDROID_SMS_GATEWAY_USER=admin
//      ANDROID_SMS_GATEWAY_PASS=admin
//
//   5. Make sure the college server (Render) can reach the phone's IP.
//      For cloud deployments, use a tool like ngrok on the phone's network:
//      ngrok http 8080  → then set ANDROID_SMS_GATEWAY_URL=https://xxxx.ngrok.io
//
// ─────────────────────────────────────────────────────────────────────────────

const ANDROID_SMS_GATEWAY_URL = process.env.ANDROID_SMS_GATEWAY_URL;
const ANDROID_SMS_GATEWAY_USER = process.env.ANDROID_SMS_GATEWAY_USER || "admin";
const ANDROID_SMS_GATEWAY_PASS = process.env.ANDROID_SMS_GATEWAY_PASS || "admin";

const androidGatewayConfigured = Boolean(ANDROID_SMS_GATEWAY_URL);

/**
 * Format a date into DD-MM-YYYY for the SMS body
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
 * Send one SMS via the Android SMS Gateway running on the college's Android phone.
 * This uses the phone's own SIM card — completely free, no third-party API charges.
 *
 * API docs: https://docs.sms-gateway.app/api-reference/messages/send-message/
 */
const sendSmsViaAndroidGateway = async (mobileNumber, message) => {
  if (!androidGatewayConfigured) {
    console.warn("Android SMS Gateway is not configured (ANDROID_SMS_GATEWAY_URL missing in .env)");
    return {
      success: false,
      error: "Android SMS Gateway not configured. Set ANDROID_SMS_GATEWAY_URL in .env",
    };
  }

  const cleanedNumber = String(mobileNumber).replace(/\D/g, "").slice(-10);

  if (cleanedNumber.length !== 10) {
    return {
      success: false,
      error: `Invalid 10-digit mobile number: ${mobileNumber}`,
    };
  }

  // Android SMS Gateway expects E.164 format: +91XXXXXXXXXX for India
  const phoneNumber = `+91${cleanedNumber}`;

  console.log(`📲 Sending SMS via Android Gateway to ${phoneNumber}`);

  try {
    const response = await axios.post(
      `${ANDROID_SMS_GATEWAY_URL}/v1/message`,
      {
        message:        message,
        phoneNumbers:   [phoneNumber],
        withDeliveryReport: true,
      },
      {
        auth: {
          username: ANDROID_SMS_GATEWAY_USER,
          password: ANDROID_SMS_GATEWAY_PASS,
        },
        headers: { "Content-Type": "application/json" },
        timeout: 15000,
      }
    );

    console.log("✅ Android Gateway response:", response.data);

    return {
      success: true,
      messageId: response.data?.id || `SMS_${Date.now()}`,
      response:  response.data,
    };
  } catch (error) {
    const errDetails = error.response?.data || error.message;
    console.error("❌ Android SMS Gateway error:", errDetails);
    return {
      success: false,
      error: typeof errDetails === "object" ? JSON.stringify(errDetails) : errDetails,
    };
  }
};

/**
 * Main SMS sending function — called automatically when attendance is submitted.
 * Uses Android SMS Gateway (free — SIM-based delivery).
 */
const sendSms = async (mobileNumber, message) => {
  if (!mobileNumber) {
    return { status: "FAILED", error: "Missing parent mobile number" };
  }

  const result = await sendSmsViaAndroidGateway(mobileNumber, message);

  if (result.success) {
    return {
      status:    "SENT",
      mobileNumber: String(mobileNumber).replace(/\D/g, "").slice(-10),
      messageId: result.messageId,
      sentAt:    new Date(),
    };
  }

  return {
    status:      "FAILED",
    mobileNumber: String(mobileNumber).replace(/\D/g, "").slice(-10),
    error:       result.error,
  };
};

/**
 * Overall delivery status helper
 */
const computeOverallStatus = (smsStatus) => {
  return ["SENT", "DELIVERED"].includes(smsStatus) ? "SUCCESS" : "FAILED";
};

/**
 * Called by attendanceRoutes.js after attendance is submitted.
 * Sends SMS to every absent student's parent automatically via Android phone SIM.
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

    const { english, tamil, combined } = renderDualMessage(studentName, gender, attendance?.date);

    // ── Send SMS automatically via college Android phone SIM ──
    const smsResult = await sendSms(parent?.mobileNumber || parent?.phone, combined);

    console.log(`SMS to ${smsResult.mobileNumber}: ${smsResult.status}`);

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
      overallStatus: computeOverallStatus(smsResult.status),
      date:          attendance.date,
      year:          attendance.year,
      section:       attendance.section,
    });
  }

  const createdLogs = await MessageLog.insertMany(logs);

  console.log(`📊 Notification summary: ${createdLogs.filter(l => l.overallStatus === "SUCCESS").length}/${createdLogs.length} sent`);

  return {
    total:        createdLogs.length,
    successCount: createdLogs.filter((l) => l.overallStatus === "SUCCESS").length,
    failedCount:  createdLogs.filter((l) => l.overallStatus === "FAILED").length,
    logs:         createdLogs,
  };
};

module.exports = {
  renderDualMessage,
  sendAbsenceNotifications,
  sendSms,
};
