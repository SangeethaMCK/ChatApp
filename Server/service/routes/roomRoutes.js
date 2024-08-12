const express = require('express');
const router = express.Router();
const { createRoom } = require('../controllers/roomController');

router.post('/create', createRoom);

module.exports = router;
