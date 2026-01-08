//services/antiqueBook.services.js
import AntiqueBook from "../models/AntiqueBook.model.js";

// In-memory cache for auction lastBidTime (auctionId -> lastBidTime)
const auctionBidTimeCache = new Map();

export const addBid = async (bookId, bidderId, bidAmount) => {
  const book = await AntiqueBook.findById(bookId);

  if (!book) {
    throw new Error("Antique book not found");
  }

  // Enforce only approved and active auctions accept bids
  const now = new Date();
  if (book.status !== 'approved')
    throw new Error("Bidding not allowed: auction not approved");
  if (now < new Date(book.auctionStart))
    throw new Error("Bidding not allowed: auction hasn't started");
  if (now > new Date(book.auctionEnd))
    throw new Error("Bidding not allowed: auction has ended");

  // Enforce bid increment rules (at least basePrice, and greater than currentPrice)
  const minAllowed = Math.max(book.basePrice || 0, book.currentPrice || 0);
  if (bidAmount <= minAllowed) {
    throw new Error(`Bid must be greater than ₹${minAllowed}`);
  }

  book.biddingHistory.push({
    bidder: bidderId,
    bidAmount,
  });

  book.currentPrice = bidAmount;

  await book.save();
  
  // Populate the new bidder info for response
  await book.populate('biddingHistory.bidder', 'firstname lastname email');
  
  // Update cache with new lastBidTime
  const lastBid = book.biddingHistory[book.biddingHistory.length - 1];
  if (lastBid && lastBid.bidTime)
    auctionBidTimeCache.set(bookId.toString(), lastBid.bidTime.toISOString());
  
  return book;
};

export const createAntiqueBook = async (bookData) => {
  try {
    const newAntiqueBook = new AntiqueBook(bookData);
    return await newAntiqueBook.save();
  } catch (error) {
    console.error("Error creating antique book:", error);
    throw new Error("Failed to create antique book.");
  }
};

export const getOngoingAuctions = async () => {
  return await AntiqueBook.find({
    status: 'approved',
    auctionStart: { $lte: new Date() },
    auctionEnd: { $gte: new Date() },
  })
    .sort({ auctionEnd: 1 })
    .select('_id title author image auctionStart auctionEnd currentPrice basePrice')
    .lean();
};

export const getFutureAuctions = async () => {
  return await AntiqueBook.find({
    status: 'approved',
    auctionStart: { $gt: new Date() },
  })
    .sort({ auctionStart: 1 })
    .select('_id title author image auctionStart auctionEnd currentPrice basePrice')
    .lean();
};

export const getEndedAuctions = async () => {
  const docs = await AntiqueBook.find({
    status: 'approved',
    auctionEnd: { $lt: new Date() },
  })
    .sort({ auctionEnd: -1 })
    .populate('biddingHistory.bidder', 'firstname lastname')
    .lean();

  // Attach winner info if sold
  return docs.map((d) => {
    if (Array.isArray(d.biddingHistory) && d.biddingHistory.length > 0 && (d.currentPrice || 0) > 0) {
      // Determine highest bid; if tie, latest occurrence wins
      let winnerBid = d.biddingHistory[0];
      for (const bid of d.biddingHistory) {
        if (
          bid.bidAmount > winnerBid.bidAmount ||
          (bid.bidAmount === winnerBid.bidAmount && new Date(bid.bidTime) > new Date(winnerBid.bidTime))
        ) {
          winnerBid = bid;
        }
      }
      const name = winnerBid.bidder
        ? `${winnerBid.bidder.firstname || ''} ${winnerBid.bidder.lastname || ''}`.trim()
        : undefined;
      return {
        ...d,
        winnerBuyer: winnerBid.bidder ? { _id: winnerBid.bidder._id, name } : undefined,
        finalPrice: d.currentPrice || d.basePrice,
      };
    }
    return { ...d, finalPrice: d.currentPrice || d.basePrice };
  });
};

export const getAuctionItemById = async (bookId) => {
  const book = await AntiqueBook.findById(bookId)
    .populate("biddingHistory.bidder", "firstname lastname email")
    .lean();
  if (!book)
    throw new Error("Antique book not found");

  if (book.status !== 'approved')
    throw new Error("Auction not available");
  return book;
};

export const getAuctionPollingData = async (bookId, lastBidTime) => {
  const cachedLastBidTime = auctionBidTimeCache.get(bookId.toString());
  
  // Step 1: Check cache for early return (NO DB query)
  if (lastBidTime && cachedLastBidTime && lastBidTime === cachedLastBidTime) {
    return {
      hasNewBids: false,
      newBids: [],
      timestamp: new Date(),
      cached: true
    };
  }
  
  // Step 2: Cache miss - validate auction exists and is approved
  const book = await AntiqueBook.findById(bookId)
    .select('status currentPrice')
    .lean();
  
  if (!book) 
    throw new Error("Auction not found");
  
  if (book.status !== 'approved')
    throw new Error("Auction not available");
  
  if (!book) 
    throw new Error("Auction not found");
  
  if (book.status !== 'approved')
    throw new Error("Auction not available");

  
  let newBids = [];
  
  if (lastBidTime) {
    // Query for bids after lastBidTime
    const bookWithBids = await AntiqueBook.findOne({
      _id: bookId,
      'biddingHistory.bidTime': { $gt: new Date(lastBidTime) }
    })
    .select('biddingHistory')
    .populate('biddingHistory.bidder', 'firstname lastname email')
    .lean();
    
    if (bookWithBids && bookWithBids.biddingHistory) {
      // Filter to only get bids after lastBidTime
      newBids = bookWithBids.biddingHistory.filter(
        bid => new Date(bid.bidTime) > new Date(lastBidTime)
      );
    }
  } else {
    // First poll without timestamp - return last 5 bids
    const bookWithBids = await AntiqueBook.findById(bookId)
      .select('biddingHistory')
      .populate('biddingHistory.bidder', 'firstname lastname email')
      .lean();
    
    if (bookWithBids && bookWithBids.biddingHistory) {
      newBids = bookWithBids.biddingHistory
        .sort((a, b) => new Date(b.bidTime) - new Date(a.bidTime))
        .slice(0, 5);
    }
  }
  
  // Step 4: Update cache with latest bidTime
  if (newBids.length > 0) {
    const latestBid = newBids.reduce((latest, bid) => 
      new Date(bid.bidTime) > new Date(latest.bidTime) ? bid : latest
    );
    auctionBidTimeCache.set(bookId.toString(), latestBid.bidTime.toISOString());
  } else if (lastBidTime && !cachedLastBidTime)
    auctionBidTimeCache.set(bookId.toString(), lastBidTime);
  
  // Step 5: Return ONLY what changes during auction
  return {
    currentPrice: book.currentPrice,    // Only field that changes
    newBids: newBids,                   // Only new bids
    hasNewBids: newBids.length > 0,     // Convenience flag
    timestamp: new Date(),              // Server time for debugging
    cached: false                       // Debug flag
  };
};