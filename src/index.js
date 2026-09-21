import { EmailMessage } from "cloudflare:email";
import { createMimeMessage } from "mimetext";

const TO_EMAIL = "tevoragolf@gmail.com";
const FROM_EMAIL = "website@golftevora.com";

async function sendNotification(env, subject, text) {
  const msg = createMimeMessage();

  msg.setSender({
    name: "GolfTevora Website",
    addr: FROM_EMAIL
  });

  msg.setRecipient(TO_EMAIL);
  msg.setSubject(subject);

  msg.addMessage({
    contentType: "text/plain",
    data: text
  });

  const message = new EmailMessage(
    FROM_EMAIL,
    TO_EMAIL,
    msg.asRaw()
  );

  await env.EMAIL.send(message);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // GET WAITLIST COUNT
    if (url.pathname === "/api/waitlist" && request.method === "GET") {
      try {
        const list = await env.WAITLIST.list({
          prefix: "email:"
        });

        return Response.json({
          count: list.keys.length
        });
      } catch (err) {
        console.error("WAITLIST COUNT ERROR:", err);

        return Response.json(
          { success: false, error: "Unable to retrieve count" },
          { status: 500 }
        );
      }
    }

    // ADD EMAIL TO WAITLIST
    if (url.pathname === "/api/waitlist" && request.method === "POST") {
      try {
        const body = await request.json();
        const email = body.email?.trim().toLowerCase();

        if (!email || !email.includes("@")) {
          return Response.json(
            { success: false, error: "Invalid email" },
            { status: 400 }
          );
        }

        // Save signup first
        await env.WAITLIST.put(
          "email:" + email,
          JSON.stringify({
            email: email,
            created: new Date().toISOString()
          })
        );

        console.log("WAITLIST SAVED:", email);

        // Email notification is secondary.
        try {
          await sendNotification(
            env,
            "New GolfTevora TeeBank signup",
            `A new golfer joined the TeeBank waitlist.

Email: ${email}`
          );

          console.log("WAITLIST EMAIL SENT:", email);

        } catch (emailError) {
          console.error(
            "WAITLIST EMAIL ERROR:",
            emailError?.message || String(emailError)
          );
        }

        // Signup succeeded because it is safely stored in KV.
        return Response.json({
          success: true
        });

      } catch (err) {
        console.error(
          "WAITLIST ERROR:",
          err?.message || String(err)
        );

        return Response.json(
          { success: false, error: "Unable to save signup" },
          { status: 500 }
        );
      }
    }

    // FEEDBACK
    if (url.pathname === "/api/feedback" && request.method === "POST") {
      try {
        const body = await request.json();
        const feedback = body.feedback?.trim();

        if (!feedback) {
          return Response.json(
            { success: false, error: "Feedback required" },
            { status: 400 }
          );
        }

        // Save feedback first
        const feedbackId = crypto.randomUUID();

        await env.WAITLIST.put(
          "feedback:" + feedbackId,
          JSON.stringify({
            feedback: feedback,
            created: new Date().toISOString()
          })
        );

        console.log("FEEDBACK SAVED:", feedbackId);

        // Email notification is secondary.
        try {
          await sendNotification(
            env,
            "New GolfTevora website feedback",
            `New feedback was submitted on GolfTevora.com:

${feedback}`
          );

          console.log("FEEDBACK EMAIL SENT:", feedbackId);

        } catch (emailError) {
          console.error(
            "FEEDBACK EMAIL ERROR:",
            emailError?.message || String(emailError)
          );
        }

        return Response.json({
          success: true
        });

      } catch (err) {
        console.error(
          "FEEDBACK ERROR:",
          err?.message || String(err)
        );

        return Response.json(
          { success: false, error: "Unable to save feedback" },
          { status: 500 }
        );
      }
    }

    return env.ASSETS.fetch(request);
  }
};
