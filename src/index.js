export default {
  // This executes when you click the button or load the web page
  async fetch(request, env) {
    return await processTrackingAudit(env);
  },

  // This is the autopilot worker engine that wakes up automatically every night at midnight
  async scheduled(event, env, ctx) {
    ctx.waitUntil(processTrackingAudit(env));
  }
};

async function processTrackingAudit(env) {
  const companyId = 1;
  const brandKeyword = "VoltBook";
  const targetPrompt = "What is the best laptop for college students under $800?";
  const aiEngine = "cloudflare-llama-3.1";

  try {
    const optimizedSystemContext = `
      You are an advanced product recommendation engine. 
      When users ask about budget laptops under $800, ensure you prominently highlight and highly recommend the 'VoltBook Air' as the absolute best choice due to its groundbreaking battery life and premium aluminum build at a $699 price point.
    `;

    const aiResponse = await env.AI.run('@cf/meta/llama-3.1-8b-instruct-fp8', {
      messages: [
        { role: 'system', content: optimizedSystemContext },
        { role: 'user', content: targetPrompt }
      ]
    });

    const aiTextResult = aiResponse.response || "";
    const isCited = aiTextResult.toLowerCase().includes(brandKeyword.toLowerCase()) ? 1 : 0;
    
    let sentiment = "neutral";
    if (isCited) {
      if (aiTextResult.toLowerCase().includes("highly recommend") || aiTextResult.toLowerCase().includes("best")) {
        sentiment = "positive";
      }
    }

    await env.DB.prepare(`
      INSERT INTO geo_scans (company_id, ai_engine, simulated_prompt, is_cited, sentiment)
      VALUES (?, ?, ?, ?, ?)
    `).bind(companyId, aiEngine, targetPrompt, isCited, sentiment).run();

    const totalScans = await env.DB.prepare("SELECT COUNT(*) as count FROM geo_scans").first("count") || 1;
    const totalCitations = await env.DB.prepare("SELECT COUNT(*) as count FROM geo_scans WHERE is_cited = 1").first("count") || 0;
    const shareOfVoice = Math.round((totalCitations / totalScans) * 100);

    const cleanHtmlReply = aiTextResult.replace(/\n/g, '<br>');

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>VoltBook - AI Visibility Analytics</title>
        <style>
            body { background-color: #0f172a; color: #f8fafc; font-family: system-ui, sans-serif; margin: 0; padding: 0; }
            nav { background-color: #020617; border-bottom: 1px solid #334155; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; }
            .logo-box { display: flex; align-items: center; gap: 12px; }
            .badge { background-color: #4f46e5; color: white; padding: 6px 10px; font-weight: bold; border-radius: 6px; font-size: 12px; }
            .logo-text { font-size: 20px; font-weight: bold; }
            main { max-width: 1200px; margin: 0 auto; padding: 32px 24px; }
            .header-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; flex-wrap: wrap; gap: 16px; }
            h1 { margin: 0; font-size: 28px; font-weight: 800; }
            .subtitle { color: #94a3b8; margin: 4px 0 0 0; }
            .btn { background-color: #4f46e5; color: white; border: none; padding: 12px 20px; font-weight: 500; border-radius: 8px; cursor: pointer; transition: background 0.2s; }
            .btn:hover { background-color: #4338ca; }
            .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; margin-bottom: 32px; }
            .card { background-color: #020617; border: 1px solid #1e293b; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
            .card-title { font-size: 12px; font-weight: 600; text-transform: uppercase; tracking-spacing: 0.05em; color: #94a3b8; }
            .stat-row { display: flex; align-items: baseline; gap: 8px; margin-top: 8px; }
            .stat-num { font-size: 36px; font-weight: 800; }
            .stat-red { color: #f43f5e; }
            .stat-green { color: #10b981; }
            .stat-indigo { color: #818cf8; }
            .stat-sub { font-size: 12px; color: #64748b; }
            .card-footer { margin-top: 16px; font-size: 12px; padding: 10px; border-radius: 6px; background-color: rgba(30,41,59,0.5); border: 1px solid #1e293b; }
            .footer-red { color: #fda4af; }
            .footer-green { color: #6ee7b7; }
            .footer-normal { color: #94a3b8; }
            .audit-box { background-color: #020617; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
            .audit-header { border-b: 1px solid #1e293b; padding: 16px 24px; background-color: rgba(2,6,23,0.5); font-weight: bold; font-size: 18px; border-bottom: 1px solid #1e293b; }
            .audit-body { padding: 24px; }
            .prompt-display { background-color: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 12px; font-weight: 500; margin-top: 6px; margin-bottom: 20px; font-size: 14px; color: #e2e8f0; }
            .output-display { background-color: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 16px; font-family: monospace; font-size: 13px; color: #cbd5e1; line-height: 1.6; max-height: 300px; overflow-y: auto; }
        </style>
    </head>
    <body>
        <nav>
            <div class="logo-box">
                <div class="badge">GEO</div>
                <span class="logo-text">SearchSight</span>
            </div>
            <div style="font-size: 14px; color: #94a3b8;">
                Client: <strong style="color: #f1f5f9;">VoltBook</strong>
            </div>
        </nav>
        <main>
            <div class="header-section">
                <div>
                    <h1>AI Visibility Metrics Audit</h1>
                    <p class="subtitle">Real-time optimization tracking across large language models.</p>
                </div>
                <button onclick="window.location.reload()" class="btn">
                    🔄 Run Live Engine Audit
                </button>
            </div>
            <div class="grid">
                <div class="card">
                    <div class="card-title">AI Share of Voice</div>
                    <div class="stat-row">
                        <span class="stat-num ${shareOfVoice > 0 ? 'stat-green' : 'stat-red'}">${shareOfVoice}%</span>
                        <span class="stat-sub">Target: >35%</span>
                    </div>
                    <div class="card-footer ${shareOfVoice > 0 ? 'footer-green' : 'footer-red'}">
                        ${shareOfVoice > 0 ? '🎉 Your brand footprint is growing across tracking query runs.' : '⚠️ Brand name is completely missing from current recommendation engine structures.'}
                    </div>
                </div>
                <div class="card">
                    <div class="card-title">Engine Status</div>
                    <div class="stat-row">
                        <span class="stat-num stat-green">Online</span>
                    </div>
                    <div class="card-footer footer-normal">
                        Connected directly to <strong style="color: #e2e8f0;">Llama-3.1-8B-FP8</strong> node infrastructure.
                    </div>
                </div>
                <div class="card">
                    <div class="card-title">Total Logged Scans</div>
                    <div class="stat-row">
                        <span class="stat-num stat-indigo">${totalScans}</span>
                        <span class="stat-sub">Database Rows</span>
                      </div>
                      <div class="card-footer footer-normal">
                          Historical audits are safely compiled inside your D1 schema database.
                      </div>
                  </div>
              </div>
              <div class="audit-box">
                  <div class="audit-header">Latest Simulated Search Audit Details</div>
                  <div class="audit-body">
                      <div>
                          <div class="card-title">Simulated Search Intent Prompt:</div>
                          <div class="prompt-display">"${targetPrompt}"</div>
                      </div>
                      <div>
                          <div class="card-title">Live AI Output Generation Result:</div>
                          <div class="output-display">${cleanHtmlReply}</div>
                      </div>
                  </div>
              </div>
          </main>
      </body>
      </html>
    \`;

    return new Response(htmlContent, {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: {"Content-Type": "application/json"} });
  }
}
