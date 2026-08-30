import Review from '../models/Review.js';
import User from '../models/User.js';

export const createReview = async (req, res) => {
  try {
    const { projectId, revieweeId, rating, comment } = req.body;

    const existingReview = await Review.findOne({
      project: projectId,
      reviewer: req.user._id,
      reviewee: revieweeId
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this user for this project' });
    }

    const review = new Review({
      project: projectId,
      reviewer: req.user._id,
      reviewee: revieweeId,
      rating,
      comment
    });

    await review.save();

    // Update reviewee rating
    const reviewee = await User.findById(revieweeId);
    if (reviewee) {
      const totalReviews = reviewee.totalReviews + 1;
      const newRating = ((reviewee.rating * reviewee.totalReviews) + Number(rating)) / totalReviews;
      
      reviewee.rating = newRating;
      reviewee.totalReviews = totalReviews;
      await reviewee.save();
    }

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ reviewee: req.params.userId })
      .populate('reviewer', 'name role')
      .populate('project', 'title');
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
