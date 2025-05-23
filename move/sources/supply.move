module my_first_package::prediction_market;

use sui::{balance, coin, event, vec_map, vec_map::VecMap};

public struct PredictionMarket<phantom C> has key, store {
    id: UID,
    creator: address,
    friends: vector<address>,
    balance: balance::Balance<C>,
    yes: VecMap<address, u64>,
    no: VecMap<address, u64>,
    // schemeven!
    yes_tallied: u64,
    no_tallied: u64,
    yes_vote: u64,
    no_vote: u64,
    voted: vector<address>
}

public struct MarketCreated has copy, drop {
    market_id: ID
}

entry fun create_market<C>(friends: vector<address>, ctx: &mut TxContext) {
    let prediction_market = PredictionMarket {
        id: object::new(ctx),
        creator: ctx.sender(),
        friends: friends,
        balance: balance::zero<C>(),
        yes: vec_map::empty<address, u64>(),
        no: vec_map::empty<address, u64>(),
        yes_tallied: 0,
        no_tallied: 0,
        yes_vote: 0,
        no_vote: 0,
        voted: vector::empty<address>()
    };
    event::emit(MarketCreated { market_id: prediction_market.id.to_inner() });
    transfer::share_object(prediction_market)
}

#[allow(unused_variable)]
entry fun resolve<T>(prediction_market: PredictionMarket<T>, ctx: &mut TxContext) {
    let PredictionMarket {id, creator, friends: _, mut balance, yes, no, yes_tallied, no_tallied, yes_vote, no_vote, voted} = prediction_market;
    assert!((yes_vote + no_vote) * 3 > voted.length() * 2);
    let winner: vec_map::VecMap<address, u64>;
    let divisor: u64;
    if(yes_vote > no_vote) {
        winner = yes;
        divisor = yes_tallied;
    }
    else if (no_vote > yes_vote) {
        winner = no;
        divisor = no_tallied;
    }
    else {
        abort 420
    };
    let dividend = ((balance.value() as u128) * 1_000_000_000 / (divisor as u128));
    let (addresses, share) = winner.into_keys_values();
    let i: u64 = 0;
    i.range_do!(addresses.length(), |i| {
        let to_send = ((dividend * (share[i] as u128)) / 1_000_000_000) as u64;
        let x = balance.split(to_send);
        transfer::public_transfer(x.into_coin(ctx), addresses[i]);
    });
    if(balance.value() > 0) {
        transfer::public_transfer(balance.into_coin(ctx), creator);
    } else {
        balance.destroy_zero()
    };
    object::delete(id)
}

entry fun vote<T>(prediction_market: &mut PredictionMarket<T>, vote: u64, ctx: &TxContext) {
    let sender = ctx.sender();
    assert!(!prediction_market.voted.contains(&sender));
    if(vote == 0) {
        prediction_market.no_vote = 1 + prediction_market.no_vote;
    }
    else if(vote == 1) {
        prediction_market.yes_vote = 1 + prediction_market.yes_vote;
    }
    else {
        abort 69
    };
    prediction_market.voted.push_back(sender)
}

public fun buy_yes<T>(prediction_market: &mut PredictionMarket<T>, coin: coin::Coin<T>, ctx: &mut TxContext) {
    let sender = ctx.sender();
    assert!(prediction_market.friends.contains(&sender));
    let balance = coin.into_balance();
    let balance_value = balance.value();
    if(prediction_market.yes.contains(&sender)) {
        let new_value = prediction_market.yes.get_mut(&sender);
        *new_value = balance_value + *new_value;
    }
    else {
        prediction_market.yes.insert(sender, balance_value);
    };
    prediction_market.balance.join(balance);
    prediction_market.yes_tallied = prediction_market.yes_tallied + balance_value;
}

public fun buy_no<T>(prediction_market: &mut PredictionMarket<T>, coin: coin::Coin<T>, ctx: &mut TxContext) {
    let sender = ctx.sender();
    assert!(prediction_market.friends.contains(&sender));
    let balance = coin.into_balance();
    let balance_value = balance.value();
    if(prediction_market.no.contains(&sender)) {
        let new_value = prediction_market.yes.get_mut(&sender);
        *new_value = balance_value + *new_value;
    }
    else {
        prediction_market.no.insert(sender, balance_value);
    };
    prediction_market.balance.join(balance);
    prediction_market.no_tallied = prediction_market.no_tallied + balance_value;
}

public fun creator<T>(market: &PredictionMarket<T>): address {
    market.creator
}

public fun friends<T>(market: &PredictionMarket<T>): vector<address> {
    market.friends
}

public fun balance<T>(market: &PredictionMarket<T>): u64 {
    market.balance.value()
}

#[test]
fun make_market() {
    use sui::test_scenario;
    use sui::sui::SUI;
    use std::debug;
    let maker = @0x111111;
    let friend_1 = @0x222222;
    let friend_2= @0x333333;
    let friend_3 = @0x444444;
    let mut scene = test_scenario::begin(maker);
    create_market<SUI>(vector[friend_1, friend_2, friend_3], scene.ctx());
    scene.next_tx(friend_1);
    let mut prediction_market = scene.take_shared<PredictionMarket<SUI>>();
    let sui_minted = coin::mint_for_testing<SUI>(1_000_000_000, scene.ctx());
    buy_yes(&mut prediction_market, sui_minted, scene.ctx());
    prediction_market.vote(1, scene.ctx());
    scene.next_tx(friend_2);
    let sui_minted = coin::mint_for_testing<SUI>(1_000_000_000, scene.ctx());
    buy_yes(&mut prediction_market, sui_minted, scene.ctx());
    prediction_market.vote(1, scene.ctx());
    scene.next_tx(friend_3);
    let sui_minted = coin::mint_for_testing<SUI>(1_000_000_000, scene.ctx());
    buy_no(&mut prediction_market, sui_minted, scene.ctx());
    prediction_market.vote(0, scene.ctx());
    debug::print(&b"math before".to_string());
    let dividend = (prediction_market.balance.value() as u128) * 1_000_000_000/ (prediction_market.yes_tallied as u128);
    debug::print(&dividend);
    debug::print(&b"math after".to_string());
    let share = (dividend * (*prediction_market.yes.get(&friend_1) as u128)) / 1_000_000_000;
    debug::print(&share);
    debug::print(&prediction_market);
    scene.next_tx(maker);
    prediction_market.resolve(scene.ctx());
    scene.end();
}

