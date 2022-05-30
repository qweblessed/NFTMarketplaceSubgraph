import { BigInt } from "@graphprotocol/graph-ts"
import {
  marketplace,
  CancelBid,
  FinishRentalForCollateral,
  FinishRentalForNFT,
  Listed,
  ListingOffer,
  ListingOfferCompleted,
  QuotedForStaking,
  Rental,
  Sale,
  StakingOfferAccepted,
  StakingOffered
} from "../generated/marketplace/marketplace"
import { ExampleEntity } from "../generated/schema"

export function handleCancelBid(event: CancelBid): void {
  // Entities can be loaded from the store using a string ID; this ID
  // needs to be unique across all entities of the same type
  let entity = ExampleEntity.load(event.transaction.from.toHex())

  // Entities only exist after they have been saved to the store;
  // `null` checks allow to create entities on demand
  if (!entity) {
    entity = new ExampleEntity(event.transaction.from.toHex())

    // Entity fields can be set using simple assignments
    entity.count = BigInt.fromI32(0)
  }

  // BigInt and BigDecimal math are supported
  entity.count = entity.count + BigInt.fromI32(1)

  // Entity fields can be set based on event parameters
  entity.listingId = event.params.listingId
  entity.seller = event.params.seller

  // Entities can be written to the store with `.save()`
  entity.save()

  // Note: If a handler doesn't require existing field values, it is faster
  // _not_ to load the entity from the store. Instead, create it fresh with
  // `new Entity(...)`, set the fields that should be updated and save the
  // entity back to the store. Fields that were not set or unset remain
  // unchanged, allowing for partial updates to be applied.

  // It is also possible to access smart contracts from mappings. For
  // example, the contract that has emitted the event can be connected to
  // with:
  //
  // let contract = Contract.bind(event.address)
  //
  // The following functions can then be called on this contract to access
  // state variables and other data:
  //
  // - contract.NFTTokenDistributionWhiteLister(...)
  // - contract.NFTsEligibleForTokenDistribution(...)
  // - contract._listings(...)
  // - contract._listingsLastIndex(...)
  // - contract._stakings(...)
  // - contract._stakingsExtension(...)
  // - contract._stakingsLastIndex(...)
  // - contract.canRentNFT(...)
  // - contract.dateOfNextPayment(...)
  // - contract.factory(...)
  // - contract.getContractBalance(...)
  // - contract.getListing(...)
  // - contract.getStaking(...)
  // - contract.isBuyable(...)
  // - contract.isCollateralClaimable(...)
  // - contract.maxCollateralEligibleForTokens(...)
  // - contract.nftListingIds(...)
  // - contract.nftStakingIds(...)
  // - contract.paymentsDue(...)
  // - contract.platform(...)
  // - contract.tokensDistributionAmount(...)
  // - contract.tokensDistributionEnd(...)
  // - contract.undasToken(...)
  // - contract.wETH(...)
}

export function handleFinishRentalForCollateral(
  event: FinishRentalForCollateral
): void {}

export function handleFinishRentalForNFT(event: FinishRentalForNFT): void {}

export function handleListed(event: Listed): void {}

export function handleListingOffer(event: ListingOffer): void {}

export function handleListingOfferCompleted(
  event: ListingOfferCompleted
): void {}

export function handleQuotedForStaking(event: QuotedForStaking): void {}

export function handleRental(event: Rental): void {}

export function handleSale(event: Sale): void {}

export function handleStakingOfferAccepted(event: StakingOfferAccepted): void {}

export function handleStakingOffered(event: StakingOffered): void {}
