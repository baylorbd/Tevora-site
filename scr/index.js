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

        return Response.json({
          success: true
        });

      } catch (err) {
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

        return Response.json({
          success: true
        });

      } catch (err) {
        return Response.json(
          { success: false, error: "Unable to save feedback" },
          { status: 500 }
        );
      }
    }

    // SERVE THE WEBSITE
    return env.ASSETS.fetch(request);
  }
};
