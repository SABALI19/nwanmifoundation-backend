import Task from "../models/Task.js";

export const getTasks = async (req, res) => {
  try {
    // Always scope reads to req.user so one valid token cannot browse another user's tasks.
    const tasks = await Task.find({ user: req.user._id }).sort({ createdAt: -1 });

    return res.status(200).json({ tasks });
  } catch (error) {
    return res.status(500).json({ message: "tasks unavailable" });
  }
};

export const getTask = async (req, res) => {
  try {
    // Match both id and owner; a real task id should still behave like "not found" for other users.
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!task) {
      return res.status(404).json({ message: "No task found" });
    }

    return res.status(200).json({ task });
  } catch (error) {
    return res.status(500).json({ message: "Task unavailable" });
  }
};

export const createTask = async (req, res) => {
  try {
    const { title, tag, due } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Task title is required" });
    }

    const task = await Task.create({
      title,
      tag,
      due,
      // Ownership is assigned from the verified JWT, not from a client-supplied user id.
      user: req.user._id,
    });

    return res.status(201).json({
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)
        .map((fieldError) => fieldError.message)
        .join(", ");

      return res.status(400).json({ message });
    }

    return res.status(500).json({ message: "Failed to create task" });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { title, tag, due, done } = req.body;
    const updates = {};

    // Build a patch object so omitted fields are left untouched during quick status updates.
    if (title !== undefined) updates.title = title;
    if (tag !== undefined) updates.tag = tag;
    if (due !== undefined) updates.due = due;
    if (done !== undefined) updates.done = done;

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ message: "Task unavailable" });
    }

    return res.status(200).json({
      message: "Task updated successfully",
      task,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update task" });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      // Deleting uses the same ownership guard as reads, preventing cross-account deletes by id guessing.
      user: req.user._id,
    });

    if (!task) {
      return res.status(404).json({ message: "Tasks unavailable" });
    }

    return res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Unable to delete task" });
  }
};
