// controllers/cookieController.js

exports.setCookie = async (req, res) => {
    try {
      const { sessionId } = req.body;
      res.cookie("sessionId", sessionId, {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        path: "/",
      });
      res.json("Cookie has been set"); //200
    } catch (err) {
      console.error("Error setting cookie", err);
      res.status(500).send("Error setting cookie");
    }
  };
  
  exports.getCookie = async (req, res) => {
    try {
      let sessionId = req.cookies.sessionId;
      console.log("sessionId", sessionId);
      res.json({ sessionId });
    } catch (err) {
      console.error("Error getting cookie", err);
      res.sendStatus(err.statusCode || 500);
    }
  };
  
  exports.deleteCookie = (req, res) => {
    try {
      res.clearCookie("sessionId");
      res.json("Cookie has been deleted"); //204
    } catch (err) {
      console.error("Error deleting cookie", err);
      res.sendStatus(err.statusCode || 500);
    }
  };
  