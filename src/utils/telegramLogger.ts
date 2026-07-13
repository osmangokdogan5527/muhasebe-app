export function reportErrorToTelegram(error: Error, context: string) {
  const stackTrace = error.stack || 'No stack trace';
  console.error(`[${context}] Caught error:`, error);
  
  if (window.electronAPI && (window.electronAPI as any).reportError) {
    (window.electronAPI as any).reportError({
      message: `[${context}] ${error.message || 'Bilinmeyen Hata'}`,
      stack: stackTrace
    });
  } else {
    try {
      const TELEGRAM_BOT_TOKEN = localStorage.getItem('storm_muhasebe_telegram_bot_token') || "8661867798:AAHVgj4cyEw3D_NS19jjiSBqkJe7nvIFfy0";
      const TELEGRAM_CHAT_ID = localStorage.getItem('storm_muhasebe_telegram_chat_id') || "-5266920189";
      const activeUser = localStorage.getItem('storm_active_user_email') || 'Bilinmeyen Kullanıcı';
      
      if (TELEGRAM_BOT_TOKEN) {
        const shortStack = stackTrace.split('\n').slice(0, 3).join('\n');
        const text = `🚨 <b>STORM MUHASEBE HATA RAPORU (WEB)</b>\n\n<b>Modül:</b> ${context}\n<b>Hata:</b> ${error.message}\n<b>Kullanıcı:</b> ${activeUser}\n\n<b>Stack Trace:</b>\n<pre>${shortStack}</pre>`;
        
        fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: text,
            parse_mode: 'HTML'
          })
        }).catch(err => console.error('Telegram web send error:', err));
      }
    } catch (err) {
      console.error('Error while sending telegram report:', err);
    }
  }
}
