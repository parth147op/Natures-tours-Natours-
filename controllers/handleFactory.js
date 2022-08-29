exports.deleteOne = Model => async (req, res) => {
    try {
      const Doc = await Model.findByIdAndDelete(req.params.id);
      if(!Doc){
        return res.status(404).json({
            status: `fail`,
            message: `No Document found with that ID`,
          });
      }
      res.status(201).json({
        status: "success",
        data: {
          message: `Deleted Successfully!!!`,
          Doc: Doc,
        },
      });
    } catch (err) {
      res.status(400).json({
        status: `fail`,
        message: err,
      });
    }
  };