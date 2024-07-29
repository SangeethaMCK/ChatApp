const express = require('express');
const mongoose = require('mongoose');

const app = express();

const UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    socketid: String
})

const UserModel = mongoose.model('User', UserSchema);

mongoose.connect("mongodb://localhost:27017/ChatApp");


app.listen(3000, () => {
    console.log("Server is listening on port 3000");
});

app.get('/getUsers', (req, res) => {
  UserModel.find().then(function(users) {
    res.json(users);
  }).catch(function(err) {
    console.log(err);
  });
});
