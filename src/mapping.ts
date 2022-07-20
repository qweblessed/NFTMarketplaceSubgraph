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
  StakingOffered,OfferForNotListed, stopRentalEvent

} from "../generated/marketplace/marketplace"

import {Approval, nft as Nftcontract} from "../generated/nft/nft"
import {BuyingOffer, Listing,StakingListing,StakingOffer,Collection, Token,OfferForUserNft
  //  Statistic,
  } from "../generated/schema"
import { nft, createdCollection,collectionTokenMint } from "../generated/nft/nft"

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
  
  if(tokenAddress == '0x19cf92bc45bc202dc4d4ee80f50ffe49cb09f91d'){
    
    const token = Token.load(event.params.tokenId.toString())
  
    if(!token) throw new Error('!collectionId in token')

    stat.collectionId = token.collectionId
    stat.collectionName = token.collectionName
    
    token.price = event.params.price
    token.listingId = event.params.listingId.toString()
    token.save()
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

  const tokenAddress = event.params.token.toHexString();
  log.info('true' + tokenAddress, ['true'])
  if(tokenAddress == '0x19cf92bc45bc202dc4d4ee80f50ffe49cb09f91d'){
    
    const token = Token.load(event.params.tokenId.toString())
  
    if(!token) throw new Error('!collectionId in token')
    log.info('true', ['true'])

    stat.collectionId = token.collectionId
    stat.collectionName = token.collectionName
    
    token.colloteral = event.params.collateral
    token.premiumWei = event.params.premium
    token.stakingId = event.params.stakingId.toString()
    token.save()
    stat.save();

  } 

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

  listing.listingStatus = "SOLD"
  listing.hasOffer = false;
  listing.seller = event.params.buyer;
  
  const tokenAddress = event.params.token.toHexString();

  if(tokenAddress == "0x19cf92bc45bc202dc4d4ee80f50ffe49cb09f91d"){
    
  const token = Token.load(event.params.tokenId.toString())!
  
    if(!token) throw new Error('!collectionId in token')

      const collectionId = token.collectionId

      const collection = Collection.load(collectionId.toString())

      if(!collection) throw new Error('!collection')
      if(!collection.collectionVolume) throw new Error('!collection')

      collection.collectionVolume = collection.collectionVolume.plus(event.params.price)
      collection.save()

      token.owner = event.params.buyer
      token.price = null
      token.save()

  } 

  listing.save();
 
}

export function handleStakingOffered(event:StakingOffered): void {

  const stakingId = event.params.stakingId
  const uniqueId = event.params.taker.toHexString() + event.params.stakingId.toString()
  const stat = new StakingOffer(uniqueId);
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
  const uniqueId = event.params.buyer.toHexString() + event.params.listingId.toString()
  const stat = new BuyingOffer(uniqueId);
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

  if(listing.listingStatus) {
     listing.listingStatus = "ACTIVE"
  }
  
  listing.save()
  stat.save()
}

export function handleRental(event:Rental): void {
  const stakingId = event.params.rentalId
  const staking = StakingListing.load(stakingId.toString());

  if (!staking) throw new Error('Staking entity is not found');

  staking.stakingStatus = "RENTED"
  staking.hasOffer = false;
  staking.taker = event.params.taker;

  const token = Token.load(staking.tokenId.toString())

  if(!token) throw new Error('Token entity is not found');
  token.colloteral = null
  token.premiumWei = null

  token.save()
  staking.save();
}

export function handleListingOfferCompleted(event:ListingOfferCompleted):void{//complete
  const listingId = event.params.listingId
  const uniqueId = event.params.buyer.toHexString() + event.params.listingId.toString();
  
  const statListingOffer = BuyingOffer.load(uniqueId);
  const listing = Listing.load(listingId.toString());

  if (!listing) throw new Error('Listing entity is not found');
  if (!statListingOffer) throw new Error('statListingOffer entity is not found');

  statListingOffer.offerStatus = "ACCEPTED"

  listing.listingStatus = "SOLD"
  listing.seller = event.params.buyer;
  listing.hasOffer = false;

  const token = Token.load(listing.tokenId.toString())
  if(!token) throw new Error('Token entity is not found');

  token.owner = event.params.buyer;
  token.price = null

  token.save()
  statListingOffer.save()
  listing.save()
}

export function handleStakingOfferAccepted(event:StakingOfferAccepted): void {

  const stakingId = event.params.stakingId
  
  const staking = StakingListing.load(stakingId.toString());
  const uniqueId = event.params.taker.toHexString() + event.params.stakingId.toString()
  const offer = StakingOffer.load(uniqueId);
  
  if(!staking) throw new Error('!staking entity is not found');
  if(!offer) throw new Error('!offer entity is not found');

  staking.stakingStatus = "RENTED";
  staking.hasOffer = false;

  offer.offerStatus = "ACCEPTED";

  const token = Token.load(staking.tokenId.toString())
  
  if(!token) throw new Error('Token entity is not found');
  token.owner = event.params.taker;
  token.colloteral = null
  token.premiumWei = null

  token.save()
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
    case 7 : {collection.collectionCategory = "OTHER"; break;}

    default: { 
      break; 
   } 
  }

  collection.collectionInfo = event.params.information;
  collection.collectionName = event.params.collectionName;
  collection.collectionUrl = event.params.logoImgUrl;
  collection.collectionBannerUrl = event.params.bannerImgUrl;
  collection.collectionFeatureUrl = event.params.featuredImgUrl;
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
    nft.description = event.params.description;
    nft.owner = event.params.to;
    nft.creator = event.params.to;
    nft.collection = event.params.collectionId.toString()
    nft.collectionId = event.params.collectionId
    nft.collectionName = collection.collectionName;
    nft.tokenAdress = "0x19cf92bc45bc202dc4d4ee80f50ffe49cb09f91d";
    nft.hasOffer = false;
    nft.collectionCategory = collection.collectionCategory;
    nft.save()

    if(nft.id == null)throw new Error('id entity is not found');
    
    collection.collectionItemsAmount = collection.collectionItemsAmount.plus(BigInt.fromString("1"));
    
    collection.save()
  

} 

export function handleOfferForNotListed(event:OfferForNotListed):void{
    const offerId = event.params.offerId
    const offerStats = new OfferForUserNft(offerId.toString())
    const tokenId = event.params.tokenId

    offerStats.collectionId = event.params.collectionId
    offerStats.offerId = event.params.offerId

    const token = Token.load(event.params.tokenId.toString())

    if(!token) throw new Error('token entity is not found');
    
    offerStats.tokenId = token.id
    offerStats.tokenName = token.name
    offerStats.tokenUri = token.uri
    offerStats.to = token.owner
    offerStats.offeredAmount = event.params.amount
    

    if(event.params.status == 0){
      offerStats.offerStatus = 'ACTIVE' 
      offerStats.from = event.params.actor

      token.hasOffer = true;
    }

    if(event.params.status == 1){
      offerStats.offerStatus = 'ACCEPTED'
      offerStats.to = event.params.actor; 

      if(token.stakingId) {
        const stakingId = token.stakingId!
        const staking = StakingListing.load(stakingId.toString());

          if(staking) {
            staking.stakingStatus = "RENTED";

            token.colloteral = null;
            token.premiumWei = null;
            token.price = null;

            staking.save()
            token.save()
        }
      }
      if(token.listingId) {
        const listingId = token.listingId!
        const listing = Listing.load(listingId.toString());

          if(listing) {

            listing.listingStatus = "SOLD";
            listing.save()
          }
        }
      if(offerStats.from !== null) {
      token.owner = offerStats.from;
      token.hasOffer = false;
    }
      for(let i=0;i<tokenId.toI32() + 101;i++){
        let offer = OfferForUserNft.load(i.toString())
        if(offer) {

          if(offer.tokenId == tokenId.toString()) {
              offer.offerStatus = "EXPIRED"
              offer.save()
            }
          }
        }
      }

      if(event.params.status == 2) {
        offerStats.offerStatus = 'DENIED' 
        token.hasOffer = false;
      }

    if(event.params.status == 3) {
      offerStats.offerStatus = 'CANCELED' 
      token.hasOffer = false;
    }
    token.save()
    offerStats.save()

}

export function handlestopRentalEvent(event:stopRentalEvent):void {
    const stakingId = event.params.stakingId        
    const stat = StakingListing.load(stakingId.toString())
  
    if(!stat) throw new Error("stat entity is was n0T found")
  
    stat.stakingStatus = "EXPIRED";
    stat.save()
    
}

  
  