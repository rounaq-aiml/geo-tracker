export default {
  async fetch(request, env) {
    const companyId = 1;
    const brandKeyword = "VoltBook";
    const targetPrompt = "What is the best laptop for college students under $800?";
    const aiEngine = "cloudflare-llama-3";

    try {
      // Run the AI model directly inside Cloudflare for FREE
      const aiResponse = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
        messages: [{ role: 'user', content: targetPrompt }]
      });

      const aiTextResult = aiResponse.response;
      const isCited = aiTextResult.toLowerCase().includes(brandKeyword.toLowerCase()) ? 1 : 0;
      
      let sentiment = "neutral";
      if (isCited) {
        if (aiTextResult.toLowerCase().includes("highly recommended") || aiTextResult.toLowerCase().includes("best")) {
          sentiment = "positive";
        } else if (aiTextResult.toLowerCase().includes("complaint") || aiTextResult.toLowerCase().includes("poor")) {
          sentiment = "negative";
        }
      }

      // Save the metrics to your free D1 database
      await env.DB.prepare(`
        INSERT INTO geo_scans (company_id, ai_engine, simulated_prompt, is_cited, sentiment)
        VALUES (?, ?, ?, ?, ?)
      `).bind(companyId, aiEngine, targetPrompt, isCited, sentiment).run();

      return new Response(JSON.stringify({ success: true, brand_found: isCited, sentiment, ai_reply: aiTextResult }), {
        headers: { "Content-Type": "application/json" }
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  }
};
