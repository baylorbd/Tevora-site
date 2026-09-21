import { EmailMessage } from "cloudflare:email";
import { createMimeMessage } from "mimetext";

const TO_EMAIL = "tevoragolf@gmail.com";
const FROM_EMAIL = "website@golftevora.com";

async function sendEmail(env, subject, text) {
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
      const list = await env.WAITLIST.list({ prefix: "email:" });

      return Response.json({
        count: list.keys.length
      });
    }

    // ADD TO WAITLIST
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

        await env.WAITLIST.put(
          "email:" + email,
          JSON.stringify({
            email,
            created: new Date().toISOString()
          })
        );

        await sendEmail(
          env,
          "New GolfTevora TeeBank signup",
          `A new golfer joined the TeeBank waitlist.\n\nEmail: ${email}`
        );

        return Response.json({
          success: true
        });

      } catch (err) {
        console.error(err);

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

        await env.WAITLIST.put(
          "feedback:" + crypto.randomUUID(),
          JSON.stringify({
            feedback,
            created: new Date().toISOString()
          })
        );

        await sendEmail(
          env,
          "New GolfTevora website feedback",
          `New feedback was submitted on GolfTevora.com:\n\n${feedback}`
        );

        return Response.json({
          success: true
        });

      } catch (err) {
        console.error(err);

        return Response.json(
          { success: false, error: "Unable to save feedback" },
          { status: 500 }
        );
      }
    }

    return env.ASSETS.fetch(request);
  }
};
