module.exports = (req, res) => {
    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send('HELLO_SILENTALERT_VERCEL_OK');
};
