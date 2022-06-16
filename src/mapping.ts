import {
  BigInt,
  BigDecimal,
  Bytes,
  ethereum,
  Address,
  log,
} from "@graphprotocol/graph-ts";

import {
  marketplace,
  CancelBid,
  FinishRentalForCollateral,
  FinishRentalForNFT,
  Listed as ListedEvent,
  ListingOffer,
  ListingOfferCompleted,
  QuotedForStaking as QuotedForStakingEvent,
  Rental,
  Sale,
  StakingOfferAccepted,
  StakingOffered,

} from "../generated/marketplace/marketplace"

import {Approval, nft as Nftcontract} from "../generated/nft/nft"
import {Listing,StakingListing,StakingOffer} from "../generated/schema"

enum ListingStatus { ACTIVE, SOLD, CANCELLED }

export function handleListed(event: ListedEvent):void {

  const listingId = event.params.listingId
  
  const stat = new Listing(listingId.toString());

  stat.seller = event.params.seller;
  stat.token = event.params.token;
  stat.tokenId = event.params.tokenId;
  stat.price = event.params.price;
  stat.listingStatus = "ACTIVE";
  
  const nftContract = Nftcontract.bind(event.params.token)

  stat.tokenURI = nftContract.tokenURI(event.params.tokenId).toString()
  stat.tokenName =nftContract.tokenMetadata(event.params.tokenId).value1.toString()
  stat.tokenDescription = nftContract.tokenMetadata(event.params.tokenId).value0.toString()
  
  stat.save();

}

export function handleQuotedForStaking(event: QuotedForStakingEvent):void {

  const stakingId = event.params.stakingId
  
  const stat = new StakingListing(stakingId.toString());

  stat.seller = event.params.maker;//seller
  stat.token = event.params.token;//token
  stat.tokenId = event.params.tokenId;//tokenId
  stat.colloteralWei = event.params.collateral;//colloteralWei
  stat.deadlineUTC = event.params.deadline;//1
  stat.premiumWei = event.params.premium;//premiumWei
  stat.stakingStatus = "ACTIVE";//stakingStatus
  
  const nftContract = Nftcontract.bind(event.params.token)

  stat.tokenURI = nftContract.tokenURI(event.params.tokenId).toString()//tokenURI
  stat.tokenName =nftContract.tokenMetadata(event.params.tokenId).value1.toString()//tokenName
  stat.tokenDescription = nftContract.tokenMetadata(event.params.tokenId).value0.toString()//tokenDescription
  
  stat.save();

}

export function handleCancelBid(event: CancelBid): void {

  const listingId = event.params.listingId
  const listing = Listing.load(listingId.toString());

  if (!listing) throw new Error('Listing entity is not found');

  listing.listingStatus = "CANCELLED"
  
  listing.save();
}

export function handleApproval(event: Approval): void {

}

export function handleSale(event: Sale): void {

  const listingId = event.params.listingId
  const listing = Listing.load(listingId.toString());

  if (!listing) throw new Error('Listing entity is not found');

  const stat = new Listing(listingId.toString());

  stat.listingStatus = "SOLD"
  stat.seller = event.params.buyer;//todo: rename "seller" to "owner"
  stat.save();

}

export function handleStakingOffered(event:StakingOffered): void {

  const stakingId = event.params.stakingId
  const stat = new StakingOffer(stakingId.toString());
  const stakingListing = StakingListing.load(stakingId.toString());

  if (!stakingListing) throw new Error('Listing entity is not found');

  stat.taker = event.params.taker
  stat.newOfferedColloteral =event.params.collateral
  stat.newOfferedPremiumWei = event.params.premium
  stat.stakingId = event.params.stakingId
  stat.owner = stakingListing.seller
  stat.tokenURI = stakingListing.tokenURI
  stat.tokenId = stakingListing.tokenId
  stat.tokenName = stakingListing.tokenName
  stat.tokenAdress = stakingListing.token
  
  stat.save()

}
export function handleRental(event:Rental): void {
  const stakingId = event.params.rentalId
  const listing = StakingListing.load(stakingId.toString());

  if (!listing) throw new Error('Listing entity is not found');

  const stat = new StakingListing(stakingId.toString());

  stat.stakingStatus = "RENTED"
  stat.seller = event.params.taker;
  
  stat.save();
}
