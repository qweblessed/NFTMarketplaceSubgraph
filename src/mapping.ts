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
  StakingOffered,OfferForNotListed

} from "../generated/marketplace/marketplace"

import {Approval, nft as Nftcontract} from "../generated/nft/nft"
import {BuyingOffer, Listing,StakingListing,StakingOffer,Collection, Token,OfferForUserNft
  //  Statistic,
  } from "../generated/schema"
import { nft, createdCollection,collectionTokenMint } from "../generated/nft/nft"

export function handleListed(event: ListedEvent):void {

  const listingId = event.params.listingId
  const blockTimestamp = event.block.timestamp

  let stat = Listing.load(event.transaction.from.toHex());
  if(!stat) {
    stat = new Listing(listingId.toString());
  }
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
  
  if(tokenAddress == '0x82907ed3c6adea2f470066abf614f3b38094bef2'){
    
    const token = Token.load(event.params.tokenId.toString())
  
    if(!token) throw new Error('!collectionId in token')
    
    stat.collectionId = token.collectionId
    stat.collectionName = token.collectionName
    
    token.price = event.params.price
    token.save()
  } 

  stat.save();

  // const statistic = new Statistic(listingId.plus(blockTimestamp).toString())

  // statistic.actionType = "LIST"
  // statistic.from = event.params.seller//
  // statistic.to = event.params.seller//
  // statistic.price = event.params.price
  // statistic.timeStamp = event.block.timestamp
  
  // statistic.save()
}

export function handleQuotedForStaking(event: QuotedForStakingEvent):void {

  const stakingId = event.params.stakingId
  const blockTimestamp = event.block.timestamp

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

  const tokenAddress = event.params.token.toHexString();
 
  if(tokenAddress == '0x82907ed3c6adea2f470066abf614f3b38094bef2'){
    
    const token = Token.load(event.params.tokenId.toString())
  
    if(!token) throw new Error('!collectionId in token')
    log.info('true', ['true'])

    stat.collectionId = token.collectionId
    stat.collectionName = token.collectionName
    
    token.colloteral = event.params.collateral
    token.premiumWei = event.params.premium
    token.save()
  } 

  stat.save();

  

  // const statistic = new Statistic(stakingId.plus(blockTimestamp).toString())

  // statistic.actionType = "RENT"
  // statistic.from = event.params.maker//
  // statistic.to = event.params.maker//
  // statistic.colloteralWei = event.params.collateral
  // statistic.premiumWei = event.params.premium
  // statistic.timeStamp = event.block.timestamp
  
  // statistic.save()
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

  if(tokenAddress == "0x82907ed3c6adea2f470066abf614f3b38094bef2"){
    
  const token = Token.load(event.params.tokenId.toString())
  
    if(!token) throw new Error('!collectionId in token')

      const collectionId = token.collectionId

      const collection = Collection.load(collectionId.toString())

      if(!collection) throw new Error('!collection')
      if(!collection.collectionVolume) throw new Error('!collection')

      collection.collectionVolume = collection.collectionVolume.plus(event.params.price)
      collection.save()

      token.owner = event.params.buyer
      token.save()
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
  if(listing.listingStatus){
     listing.listingStatus = "ACTIVE"
  }
  listing.save()
  stat.save()
}

export function handleRental(event:Rental): void {
  const stakingId = event.params.rentalId
  const staking = StakingListing.load(stakingId.toString());

  if (!staking) throw new Error('Listing entity is not found');

  staking.stakingStatus = "RENTED"
  staking.seller = event.params.taker;
  staking.hasOffer = false;

  staking.save();
}

export function handleListingOfferCompleted(event:ListingOfferCompleted):void{//complete
  const listingId = event.params.listingId

  const statListingOffer = BuyingOffer.load(listingId.toString());
  const listing = Listing.load(listingId.toString());

  if (!listing) throw new Error('Listing entity is not found');
  if (!statListingOffer) throw new Error('statListingOffer entity is not found');

  statListingOffer.offerStatus = "ACCEPTED"
  listing.listingStatus = "SOLD"

  listing.seller = event.params.buyer;
  listing.hasOffer = false;

  statListingOffer.save()
  listing.save()
}

export function handleStakingOfferAccepted(event:StakingOfferAccepted): void {

  const stakingId = event.params.stakingId

  const staking = StakingListing.load(stakingId.toString());
  const offer = StakingOffer.load(stakingId.toString());

  if(!staking) throw new Error('!staking entity is not found');
  if(!offer) throw new Error('!offer entity is not found');

  staking.stakingStatus = "RENTED";
  offer.offerStatus = "ACCEPTED";

  staking.seller = event.params.taker;
  staking.hasOffer = false;

  staking.save();
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
    const collection = Collection.load(collectionID.toString())!;

    if (!collection) throw new Error('Collection entity is not found');

    const tokenId = event.params.tokenId;
    const nft = new Token(tokenId.toString());
    
    nft.uri = event.params.url;
    nft.name = event.params.name;
    nft.desciption = event.params.description;
    nft.owner = event.params.to;
    nft.creator = event.params.to;
    nft.collection = event.params.collectionId.toString()
    nft.collectionId = event.params.collectionId
    nft.collectionName = collection.collectionName;

    nft.save()

    if(nft.id == null)throw new Error('id entity is not found');
    
    collection.collectionItemsAmount = collection.collectionItemsAmount.plus(BigInt.fromString("1"));
    
    collection.save()
  

} 

export function handleOfferForNotListed(event:OfferForNotListed):void{
    const offerId = event.params.offerId
    const offerStats = new OfferForUserNft(offerId.toString())
    
    offerStats.collectionId = event.params.collectionId
    offerStats.offerId = event.params.offerId
    
     log.info(`Info!: ${event.params.status}`, [])
    if(event.params.status == 0){
      offerStats.offerStatus = 'ACTIVE' 
      offerStats.offeredAmount = event.params.amount
    }

    if(event.params.status == 1){
      offerStats.offerStatus = 'ACCEPTED' 
      offerStats.offeredAmount = new BigInt(0)
    }

    if(event.params.status == 2){
      offerStats.offerStatus = 'DENIED' 
      offerStats.offeredAmount = new BigInt(0)
    }

    offerStats.save()

}