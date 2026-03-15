fetch('https://whatsapp.com/channel/0029VbCPmHj1HspqfKinlk16')
  .then(res => res.text())
  .then(html => {
    const match = html.match(/"id":"([^"]+@newsletter)"/);
    if (match) {
        console.log('FOUND ID:', match[1]);
    } else {
        const jidMatch = html.match(/"jid":"([^"]+@newsletter)"/);
        if (jidMatch) console.log('FOUND JID:', jidMatch[1]);
        else console.log('Could not parse ID from HTML.');
    }
  }).catch(e => console.error(e));
