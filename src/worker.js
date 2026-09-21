const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const validEmail = (s) => typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

async function sendNotice(env, subject, html, text, replyTo) {
  if (!env.EMAIL) return;
  await env.EMAIL.send({
    to: "golftevora@gmail.com",
    from: "notifications@golftevora.com",
    subject, html, text,
    ...(replyTo ? { replyTo } : {})
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/waitlist" && request.method === "GET") {
      const count = Number(await env.TEVORA_DATA.get("waitlist:count") || 0);
      return json({ count });
    }
    if (url.pathname === "/api/waitlist" && request.method === "POST") {
      try {
        const body = await request.json(); const email = String(body.email || "").trim().toLowerCase();
        if (!validEmail(email)) return json({ success:false, error:"invalid_email" }, 400);
        const key = "waitlist:" + email;
        if (await env.TEVORA_DATA.get(key)) return json({ success:true, existing:true });
        await env.TEVORA_DATA.put(key, JSON.stringify({ email, createdAt:new Date().toISOString() }));
        const count = Number(await env.TEVORA_DATA.get("waitlist:count") || 0) + 1;
        await env.TEVORA_DATA.put("waitlist:count", String(count));
        await sendNotice(env, "New GolfTevora TeeBank waitlist signup", `<p><strong>${esc(email)}</strong> joined the TeeBank waitlist.</p><p>Total signups: ${count}</p>`, `${email} joined the TeeBank waitlist. Total signups: ${count}`, email);
        return json({ success:true, count });
      } catch (e) { return json({ success:false, error:"server_error" }, 500); }
    }
    if (url.pathname === "/api/feedback" && request.method === "POST") {
      try {
        const body = await request.json(); const feedback = String(body.feedback || "").trim();
        if (!feedback || feedback.length > 5000) return json({ success:false, error:"invalid_feedback" }, 400);
        const id = crypto.randomUUID();
        await env.TEVORA_DATA.put("feedback:" + id, JSON.stringify({ feedback, createdAt:new Date().toISOString() }));
        await sendNotice(env, "GolfTevora TeeBank website feedback", `<h2>New website feedback</h2><p>${esc(feedback).replace(/\n/g,'<br>')}</p>`, `New website feedback:\n\n${feedback}`);
        return json({ success:true });
      } catch (e) { return json({ success:false, error:"server_error" }, 500); }
    }
    return env.ASSETS.fetch(request);
  }
};
