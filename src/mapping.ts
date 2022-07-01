import {
  BigInt,
  BigDecimal,
  Bytes,
  ethereum,
  Address,
  log,
  bigInt,
} from "@graphprotocol/graph-ts";

import {
  CancelBid,
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
import {BuyingOffer, Listing,StakingListing,StakingOffer,Collection, Token,} from "../generated/schema"
import { nft, createdCollection,collectionTokenMint } from "../generated/nft/nft"

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
  stat.tokenName = nftContract.tokenMetadata(event.params.tokenId).value1.toString()
  stat.tokenDescription = nftContract.tokenMetadata(event.params.tokenId).value0.toString()
  stat.hasOffer = false;

  const tokenAddress = event.params.token.toHexString();
  if(tokenAddress == "0x482995da0c3f0fe629db4dca956f95a81f88c4ad"){
    
  const token = Token.load(event.params.tokenId.toString())
  
    if(!token) throw new Error('!collectionId in token')
    stat.collectionId = token.collectionId
    stat.collectionName = token.collectionName
  } 

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
  stat.hasOffer = false;//UNACTIVE

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
  listing.hasOffer = false;

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
  stat.hasOffer = false;
  stat.seller = event.params.buyer;//todo: rename "seller" to "owner"
  
  const tokenAddress = event.params.token.toHexString();

  if(tokenAddress == "0x482995da0c3f0fe629db4dca956f95a81f88c4ad"){
    
  const token = Token.load(event.params.tokenId.toString())
  
    if(!token) throw new Error('!collectionId in token')

    const collectionId = token.collectionId

    const collection = Collection.load(collectionId.toString())
    if(!collection) throw new Error('!collection')
    if(!collection.collectionVolume) throw new Error('!collection')

    collection.collectionVolume = collection.collectionVolume.plus(event.params.price)
    collection.save()
  } 

  stat.save();
 
}

export function handleStakingOffered(event:StakingOffered): void {

  const stakingId = event.params.stakingId
  const stat = new StakingOffer(stakingId.toString());
  const staking = new StakingListing(stakingId.toString())
  const stakingListing = StakingListing.load(stakingId.toString());

  if (!stakingListing) throw new Error('Listing entity is not found');
  
  stat.taker = event.params.taker
  stat.newOfferedColloteral = event.params.collateral
  stat.newOfferedPremiumWei = event.params.premium
  stat.stakingId = event.params.stakingId
  stat.owner = stakingListing.seller
  stat.tokenURI = stakingListing.tokenURI
  stat.tokenId = stakingListing.tokenId
  stat.tokenName = stakingListing.tokenName
  stat.tokenAdress = stakingListing.token
  stat.offerStatus = "ACTIVE"
  staking.hasOffer = true

  staking.save()
  stat.save()
}

export function handleListingOffer(event:ListingOffer): void {

  const listingId = event.params.listingId
  const stat = new BuyingOffer(listingId.toString());
  const listing = Listing.load(listingId.toString());

  if (!listing) throw new Error('Listing entity is not found');

    stat.taker = event.params.buyer
    stat.newOfferedPrice = event.params.amount
    stat.listingId = event.params.listingId
    stat.owner = listing.seller
    stat.tokenURI = listing.tokenURI
    stat.tokenId = listing.tokenId
    stat.tokenName = listing.tokenName
    stat.tokenAdress = listing.token
    stat.offerStatus = "ACTIVE"
    listing.hasOffer = true;
  
    listing.save()
    stat.save()
}

export function handleRental(event:Rental): void {
  const stakingId = event.params.rentalId
  const listing = StakingListing.load(stakingId.toString());

  if (!listing) throw new Error('Listing entity is not found');

  const stat = new StakingListing(stakingId.toString());

  stat.stakingStatus = "RENTED"
  stat.seller = event.params.taker;
  stat.hasOffer = false;

  stat.save();
}

export function handleListingOfferCompleted(event:ListingOfferCompleted):void{//complete
  const listingId = event.params.listingId
  const statListingOffer = new BuyingOffer(listingId.toString());
  const listing = Listing.load(listingId.toString());

  if (!listing) throw new Error('Listing entity is not found');

    statListingOffer.offerStatus = "ACCEPTED"
    listing.listingStatus = "ACCEPTED"

    listing.seller = event.params.buyer;
    listing.hasOffer = false;

    statListingOffer.save()
    listing.save()
}

export function handleStakingOfferAccepted(event:StakingOfferAccepted): void {

  const stakingId = event.params.stakingId
  const staking = StakingListing.load(stakingId.toString());

  if (!staking) throw new Error('Listing entity is not found');

  const stakingParams = new StakingListing(stakingId.toString());
  const offer = new StakingOffer(stakingId.toString());

  stakingParams.stakingStatus = "RENTED";
  offer.offerStatus = "ACCEPTED";

  stakingParams.seller = event.params.taker;
  stakingParams.hasOffer = false;

  stakingParams.save();
  offer.save()
}

export function handlecreatedCollection(event:createdCollection):void {
  const collectionID = event.params.collectionId;
  const collection = new Collection(collectionID.toString());

  switch(event.params.param0){
    case 0 : {collection.collectionCategory = "ARTWORK"; break;}
    case 1 : {collection.collectionCategory = "SPORTS"; break;}
    case 2 : {collection.collectionCategory = "PHOTOGRAPHY"; break;}
    case 3 : {collection.collectionCategory = "GAMEFI"; break;}
    case 4 : {collection.collectionCategory = "CELEBRITY"; break;}
    case 5 : {collection.collectionCategory = "RWANFT"; break;}
    case 6 : {collection.collectionCategory = "EXPLICIT"; break;}
    default: { 
      break; 
   } 
  }
  collection.collectionInfo = event.params.information;
  collection.collectionName = event.params.collectionName;
  collection.collectionUrl = event.params.url;
  collection.owner = event.params.owner
  collection.collectionVolume = new BigInt(0)
  collection.collectionItemsAmount = new BigInt(0)

  collection.save()
}

export function handlecollectionTokenMint(event:collectionTokenMint):void {
    const collectionID = event.params.collectionId;
    const collection = Collection.load(collectionID.toString());
    if (!collection) throw new Error('Collection entity is not found');

    const tokenId = event.params.tokenId;
    const nft = new Token(tokenId.toString());
    
    nft.uri = event.params.url;
    nft.name = event.params.name;
    nft.desciption = event.params.description;
    nft.owner = event.params.to;
    nft.collectionId = event.params.collectionId;
    nft.collectionName = collection.collectionName;
    
    collection.collectionItemsAmount = collection.collectionItemsAmount.plus(BigInt.fromString("1"));

    collection.save()
    nft.save()

}

  