/* eslint react/prop-types: 0 */
import React from 'react';
import {connect} from 'react-redux'
import {Link} from 'react-router'
import g from 'app/redux/GlobalReducer'
import SavingsWithdrawHistory from 'app/components/elements/SavingsWithdrawHistory';
import TransferHistoryRow from 'app/components/cards/TransferHistoryRow';
import TransactionError from 'app/components/elements/TransactionError';
import TimeAgoWrapper from 'app/components/elements/TimeAgoWrapper';
import {numberWithCommas, vestingSteem, delegatedSteem} from 'app/utils/StateFunctions'
import FoundationDropdownMenu from 'app/components/elements/FoundationDropdownMenu'
import WalletSubMenu from 'app/components/elements/WalletSubMenu'
import shouldComponentUpdate from 'app/utils/shouldComponentUpdate';
import Tooltip from 'app/components/elements/Tooltip'
import {FormattedHTMLMessage} from 'app/Translator';
import tt from 'counterpart';
import {List} from 'immutable'
import { LIQUID_TOKEN, LIQUID_TICKER, DEBT_TOKENS, VESTING_TOKEN } from 'app/client_config';
import transaction from 'app/redux/Transaction';
import {getCommunity} from '../../utils/CommunityUtil';

const assetPrecision = 1000;

class UserWallet extends React.Component {
    hexEncode(str){
        let arr1 = [];
        for (let n = 0, l = str.length; n < l; n ++)
        {
            let hex = Number(str.charCodeAt(n)).toString(16);
            arr1.push(hex);
        }
        return arr1.join('');
    }
    constructor() {
        super();
        this.state = {};
        this.onShowDepositSteem = (e) => {
            if (e && e.preventDefault) e.preventDefault();
            const name = this.props.current_user.get('username');
            const new_window = window.open();
            new_window.opener = null;
            new_window.location = 'https://tokens.weku.io';
        };
        this.onShowWithdrawSteem = (e) => {
            e.preventDefault();
            const new_window = window.open();
            new_window.opener = null;
            new_window.location = 'https://main.weku.io/community-deals/@weku-official/announcement-2019-05-24-the-market-gateway-beta-production-test';
        };
        this.onShowDepositPower = (current_user_name, e) => {
            e.preventDefault();
            const new_window = window.open();
            new_window.opener = null;
            new_window.location = 'https://tokens.weku.io';
        };
        this.onShowDepositSBD = (current_user_name, e) => {
            e.preventDefault();
            const new_window = window.open();
            new_window.opener = null;
            new_window.location = 'https://trade.weku.io/?input_coin_type=btc&output_coin_type=wkd&receive_address=' + current_user_name;
        };
        this.onShowWithdrawSBD = (e) => {
            e.preventDefault();
            const new_window = window.open();
            new_window.opener = null;
            new_window.location = 'https://trade.weku.io/unregistered_trade/wkd/btc';
        };
        this.shouldComponentUpdate = shouldComponentUpdate(this, 'UserWallet');
    }
    render() {
        const is_iOS = (window.location.hostname.toLowerCase() == 'ios.weku.io');

        const {onShowDepositSteem, onShowWithdrawSteem,
            onShowDepositSBD, onShowWithdrawSBD, onShowDepositPower} = this;
        const {convertToSteem, price_per_steem, savings_withdraws, account,
            current_user, open_orders} = this.props;
        const gprops = this.props.gprops.toJS();

        if (!account) return null;
        let vesting_steem = vestingSteem(account.toJS(), gprops);
        let delegated_steem = delegatedSteem(account.toJS(), gprops);

        let isMyAccount = current_user && current_user.get('username') === account.get('name');

        const disabledWarning = false;
        // isMyAccount = false; // false to hide wallet transactions

        const showTransfer = (asset, transferType, e) => {
            e.preventDefault();
            this.props.showTransfer({
                to: (isMyAccount ? null : account.get('name')),
                asset, transferType
            });
        };

        const savings_balance = account.get('savings_balance');
        const savings_sbd_balance = account.get('savings_sbd_balance');

        const powerDown = (cancel, e) => {
            e.preventDefault()
            const name = account.get('name');
            if (cancel) {
                const vesting_shares = cancel ? '0.000000 VESTS' : account.get('vesting_shares');
                this.setState({toggleDivestError: null});
                const errorCallback = e2 => {this.setState({toggleDivestError: e2.toString()})};
                const successCallback = () => {this.setState({toggleDivestError: null})}
                this.props.withdrawVesting({account: name, vesting_shares, errorCallback, successCallback})
            } else {
                const to_withdraw = account.get('to_withdraw')
                const withdrawn = account.get('withdrawn')
                const vesting_shares = account.get('vesting_shares')
                const delegated_vesting_shares = account.get('delegated_vesting_shares')
                this.props.showPowerdown({
                    account: name,
                    to_withdraw, withdrawn,
                    vesting_shares, delegated_vesting_shares,
                });
            }
        }

        // Sum savings withrawals
        let savings_pending = 0, savings_sbd_pending = 0;
        if(savings_withdraws) {
            savings_withdraws.forEach(withdraw => {
                const [amount, asset] = withdraw.get('amount').split(' ');
                if(asset === 'WEKU')
                    savings_pending += parseFloat(amount);
                else {
                    if(asset === 'WKD')
                        savings_sbd_pending += parseFloat(amount)
                }
            })
        }

        // Sum conversions
        let conversionValue = 0;
        const currentTime = (new Date()).getTime();
        const conversions = account.get('other_history', List()).reduce( (out, item) => {
            if(item.getIn([1, 'op', 0], "") !== 'convert') return out;

            const timestamp = new Date(item.getIn([1, 'timestamp'])).getTime();
            const finishTime = timestamp + (86400000 * 3.5); // add 3.5day conversion delay
            if(finishTime < currentTime) return out;

            const amount = parseFloat(item.getIn([1, 'op', 1, 'amount']).replace("WKD", ""));
            conversionValue += amount;

            return out.concat([
                <div key={item.get(0)}>
                    <Tooltip t={tt('userwallet_jsx.conversion_complete_tip') + ": " + new Date(finishTime).toLocaleString()}>
                        <span>(+{tt('userwallet_jsx.in_conversion', {amount: numberWithCommas('$' + amount.toFixed(3))})})</span>
                    </Tooltip>
                </div>
            ]);
        }, []);

        const balance_steem = parseFloat(account.get('balance').split(' ')[0]);
        const saving_balance_steem = parseFloat(savings_balance.split(' ')[0]);
        const divesting = parseFloat(account.get('vesting_withdraw_rate').split(' ')[0]) > 0.000000;
        const sbd_balance = parseFloat(account.get('sbd_balance'))
        const sbd_balance_savings = parseFloat(savings_sbd_balance.split(' ')[0]);
        const sbdOrders = (!open_orders || !isMyAccount) ? 0 : open_orders.reduce((o, order) => {
            if (order.sell_price.base.indexOf("WKD") !== -1) {
                o += order.for_sale;
            }
            return o;
        }, 0) / assetPrecision;

        const steemOrders = (!open_orders || !isMyAccount) ? 0 : open_orders.reduce((o, order) => {
            if (order.sell_price.base.indexOf("WEKU") !== -1) {
                o += order.for_sale;
            }
            return o;
        }, 0) / assetPrecision;

        // set displayed estimated value
        const total_sbd = sbd_balance + sbd_balance_savings + savings_sbd_pending + sbdOrders + conversionValue;
        const total_steem = vesting_steem + balance_steem + saving_balance_steem + savings_pending + steemOrders;
        let total_value = '$' + numberWithCommas(
            ((total_steem * price_per_steem) + total_sbd
        ).toFixed(2))

        // format spacing on estimated value based on account state
        let estimate_output = <p>W{total_value}</p>;
        if (isMyAccount) {
            estimate_output = <p>W{total_value}&nbsp; &nbsp; &nbsp;</p>;
        }

        /// transfer log
        let idx = 0
        const transfer_log = account.get('transfer_history')
        .map(item => {
            const data = item.getIn([1, 'op', 1]);
            const type = item.getIn([1, 'op', 0]);

            // Filter out rewards
            if (type === "curation_reward" || type === "author_reward" || type === "comment_benefactor_reward") {
                return null;
            }

            if(data.sbd_payout === '0.000 WKD' && data.vesting_payout === '0.000000 VESTS')
                return null
            return <TransferHistoryRow key={idx++} op={item.toJS()} context={account.get('name')} />;
        }).filter(el => !!el).reverse();

        let steem_menu = [
            { value: tt('g.transfer'), link: '#', onClick: showTransfer.bind( this, 'WEKU', 'Transfer to Account' ) },
            { value: tt('userwallet_jsx.transfer_to_savings'), link: '#', onClick: showTransfer.bind( this, 'WEKU', 'Transfer to Savings' ) },
            { value: tt('userwallet_jsx.power_up'), link: '#', onClick: showTransfer.bind( this, 'VESTS', 'Transfer to Account' ) },
        ]
        let power_menu = [
            { value: tt('userwallet_jsx.power_down'), link: '#', onClick: powerDown.bind(this, false) }
        ]
        let dollar_menu = [
            { value: tt('g.transfer'), link: '#', onClick: showTransfer.bind( this, 'WKD', 'Transfer to Account' ) },
            { value: tt('userwallet_jsx.transfer_to_savings'), link: '#', onClick: showTransfer.bind( this, 'WKD', 'Transfer to Savings' ) },
            { value: tt('userwallet_jsx.market'), link: '/market' },
            { value: tt('userwallet_jsx.convert_to_LIQUID_TOKEN', {LIQUID_TOKEN}), link: '#', onClick: convertToSteem },
        ]
        if(isMyAccount) {
            if(!is_iOS){
                steem_menu.push({ value: tt('g.buy'), link: '#', onClick: onShowDepositSteem.bind(this, current_user.get('username')) });
                steem_menu.push({ value: tt('g.sell'), link: '#', onClick: onShowWithdrawSteem });
                power_menu.push({ value: tt('g.buy'), link: '#', onClick: onShowDepositPower.bind(this, current_user.get('username')) })
            }
            steem_menu.push({ value: tt('userwallet_jsx.market'), link: '/market' });

            //dollar_menu.push({ value: tt('g.buy'), link: '#', onClick: onShowDepositSBD.bind(this, current_user.get('username')) });
            //dollar_menu.push({ value: tt('g.sell'), link: '#', onClick: onShowWithdrawSBD });
        }
        if( divesting ) {
            power_menu.push( { value: 'Cancel Power Down', link:'#', onClick: powerDown.bind(this, true) } );
        }

        
        
        const isWithdrawScheduled = new Date(account.get('next_vesting_withdrawal') + 'Z').getTime() > Date.now()

        const steem_balance_str = numberWithCommas(balance_steem.toFixed(3));
        const steem_orders_balance_str = numberWithCommas(steemOrders.toFixed(3));
        const power_balance_str = numberWithCommas(vesting_steem.toFixed(3));
        const received_power_balance_str = (delegated_steem < 0 ? '+' : '') + numberWithCommas((-delegated_steem).toFixed(3));
        const sbd_balance_str = numberWithCommas('W$' + sbd_balance.toFixed(3)); // formatDecimal(account.sbd_balance, 3)
        const sbd_orders_balance_str = numberWithCommas('W$' + sbdOrders.toFixed(3));
        const savings_balance_str = numberWithCommas(saving_balance_steem.toFixed(3) + ' WEKU');
        const savings_sbd_balance_str = numberWithCommas('W$' + sbd_balance_savings.toFixed(3));

        const savings_menu = [
            { value: tt('userwallet_jsx.withdraw_LIQUID_TOKEN', {LIQUID_TOKEN}), link: '#', onClick: showTransfer.bind( this, 'WEKU', 'Savings Withdraw' ) },
        ];
        const savings_sbd_menu = [
            { value: tt('userwallet_jsx.withdraw_DEBT_TOKENS', {DEBT_TOKENS}), link: '#', onClick: showTransfer.bind( this, 'WKD', 'Savings Withdraw' ) },
        ];
        // set dynamic secondary wallet values
        const sbdInterest = this.props.sbd_interest / 100;
        const sbdMessage = <span>{tt('userwallet_jsx.tokens_worth_about_1_of_LIQUID_TICKER', {LIQUID_TICKER, sbdInterest})}</span>

        const reward_steem = parseFloat(account.get('reward_steem_balance').split(' ')[0]) > 0 ? account.get('reward_steem_balance') : null;
        const reward_sbd = parseFloat(account.get('reward_sbd_balance').split(' ')[0]) > 0 ? account.get('reward_sbd_balance') : null;
        const reward_sp = parseFloat(account.get('reward_vesting_steem').split(' ')[0]) > 0 ? account.get('reward_vesting_steem').replace('WEKU', 'WP') : null;

        let rewards = [];
        if(reward_steem) rewards.push(reward_steem);
        if(reward_sbd) rewards.push(reward_sbd);
        if(reward_sp) rewards.push(reward_sp);

        let rewards_str;
        switch(rewards.length) {
          case 3:
              rewards_str = `${rewards[0]}, ${rewards[1]} and ${rewards[2]}`;
              break;
          case 2:
              rewards_str = `${rewards[0]} and ${rewards[1]}`;
              break;
          case 1:
              rewards_str = `${rewards[0]}`;
              break;
        }

        let claimbox;
        if(current_user && rewards_str && isMyAccount) {
            claimbox = <div className="row">
                    <div className="columns small-12">
                        <div className="UserWallet__claimbox">
                            Your current rewards: {rewards_str}
                            <button className="button hollow float-right" onClick={e => {this.props.claimRewards(account)}}>{tt('userwallet_jsx.redeem_rewards')}</button>
                        </div>
                    </div>
                </div>
        }
        const name = account.get('name');        
        //const current_user_name = this.props.current_user.get('username');
        const accountname_in_hex = this.hexEncode(name);
        return (<div className="UserWallet">
            {claimbox}
            <div className="row">
                <div className="columns small-10 medium-12 medium-expand">
                    {isMyAccount ? <WalletSubMenu account_name={account.get('name')} /> : <div><br /><h4>{tt('g.balances')}</h4><br /></div>}
                </div>
                {/*<div className="columns shrink">
                    {isMyAccount && <button className="UserWallet__buysp button hollow" onClick={onShowDepositSteem}>{tt('userwallet_jsx.buy_steem_or_steem_power')}</button>}
                </div>*/}
            </div>
            <div className="UserWallet__balance row zebra">   
                <div className="column small-12 medium-8">            
                 Name HEX hash: <span> {accountname_in_hex} </span>     
                </div>                 
            </div>            
            <div className="UserWallet__balance row">

                <div className="column small-12 medium-8">
                    WEKU
                    <FormattedHTMLMessage className="secondary" id="tips_js.liquid_token" params={{LIQUID_TOKEN, VESTING_TOKEN}} />
                </div>
                <div className="column small-12 medium-4">
                    {isMyAccount ?
                    <FoundationDropdownMenu className="Wallet_dropdown" dropdownPosition="bottom" dropdownAlignment="right" label={steem_balance_str + ' WEKU'} menu={steem_menu} />
                    : steem_balance_str + ' WEKU'}
                    {steemOrders ? <div style={{paddingRight: isMyAccount ? "0.85rem" : null}}><Link to="/market"><Tooltip t={tt('market_jsx.open_orders')}>(+{steem_orders_balance_str} WEKU)</Tooltip></Link></div> : null}
                </div>
            </div>
            <div className="UserWallet__balance row zebra">
                <div className="column small-12 medium-8">
                    WEKU POWER
                    <FormattedHTMLMessage className="secondary" id="tips_js.influence_token" />
                    {delegated_steem != 0 ? <span className="secondary">{tt('tips_js.part_of_your_steem_power_is_currently_delegated')}</span> : null}
                </div>
                <div className="column small-12 medium-4">
                    {isMyAccount ?
                    <FoundationDropdownMenu className="Wallet_dropdown" dropdownPosition="bottom" dropdownAlignment="right" label={power_balance_str + ' WEKU'} menu={power_menu} />
                    : power_balance_str + ' WEKU'}
                    {delegated_steem != 0 ? <div style={{paddingRight: isMyAccount ? "0.85rem" : null}}><Tooltip t="WEKU POWER delegated to this account">({received_power_balance_str} WEKU)</Tooltip></div> : null}
                </div>
            </div>

            <div className="UserWallet__balance row">
                <div className="column small-12 medium-8">
                    WEKU DOLLARS - WKD
                    {/*<div className="secondary">{sbdMessage}</div>*/}
                </div>
                <div className="column small-12 medium-4">
                    {isMyAccount ?
                    <FoundationDropdownMenu className="Wallet_dropdown" dropdownPosition="bottom" dropdownAlignment="right" label={sbd_balance_str} menu={dollar_menu} />
                    : sbd_balance_str}
                    {sbdOrders ? <div style={{paddingRight: isMyAccount ? "0.85rem" : null}}><Link to="/market"><Tooltip t={tt('market_jsx.open_orders')}>(+{sbd_orders_balance_str})</Tooltip></Link></div> : null}
                    {conversions}
                </div>
            </div>

            <div className="UserWallet__balance row zebra">
                <div className="column small-12 medium-8">
                    {tt('userwallet_jsx.savings')}
                    <div className="secondary">
                        <span>{tt('transfer_jsx.balance_subject_to_3_day_withdraw_waiting_period')}</span>
                        {/*<span>{tt('transfer_jsx.asset_currently_collecting', {asset: DEBT_TOKENS, interest: sbdInterest})}</span>*/}
                    </div>
                </div>
                <div className="column small-12 medium-4">
                    {isMyAccount ?
                    <FoundationDropdownMenu className="Wallet_dropdown" dropdownPosition="bottom" dropdownAlignment="right" label={savings_balance_str} menu={savings_menu} />
                    : savings_balance_str}
                    <br />
                    {isMyAccount ?
                    <FoundationDropdownMenu className="Wallet_dropdown" dropdownPosition="bottom" dropdownAlignment="right" label={savings_sbd_balance_str} menu={savings_sbd_menu} />
                    : savings_sbd_balance_str}
                </div>
            </div>

            <div className="UserWallet__balance row">
                <div className="column small-12 medium-8">
                    {tt('userwallet_jsx.estimated_account_value')}
                    <div>Value in WKD. The value of WKD will be decided by market.</div>
                    <div className="secondary">{tt('tips_js.estimated_value', {LIQUID_TOKEN})}</div>
                </div>
                <div className="column small-12 medium-4">
                    {estimate_output}
                </div>
            </div>
            <div className="UserWallet__balance row">
                <div className="column small-12">
                    {isWithdrawScheduled && <span>{tt('userwallet_jsx.next_power_down_is_scheduled_to_happen')}&nbsp; <TimeAgoWrapper date={account.get('next_vesting_withdrawal')} />.</span> }
                    {/*toggleDivestError && <div className="callout alert">{toggleDivestError}</div>*/}
                    <TransactionError opType="withdraw_vesting" />
                </div>
            </div>
            {disabledWarning && <div className="row">
                <div className="column small-12">
                    <div className="callout warning">
                        {tt('userwallet_jsx.transfers_are_temporary_disabled')}
                    </div>
                </div>
            </div>}
            <div className="row">
                <div className="column small-12">
                    <hr />
                </div>
            </div>

            {isMyAccount && <SavingsWithdrawHistory />}

            <div className="row">
                <div className="column small-12">
                    {/** history */}
                    <h4>{tt('userwallet_jsx.history')}</h4>
                    <table>
                        <tbody>
                        {transfer_log}
                        </tbody>
                     </table>
                </div>
            </div>
        </div>);
    }
}

export default connect(
    // mapStateToProps
    (state, ownProps) => {
        let price_per_steem = undefined;
        const feed_price = state.global.get('feed_price');
        if(feed_price && feed_price.has('base') && feed_price.has('quote')) {
            const {base, quote} = feed_price.toJS()
            if(/ WKD/.test(base) && / WEKU$/.test(quote))
                price_per_steem = parseFloat(base.split(' ')[0])
        }
        const savings_withdraws = state.user.get('savings_withdraws');
        const gprops = state.global.get('props');
        const sbd_interest = gprops.get('sbd_interest_rate');
        return {
            ...ownProps,
            open_orders: state.market.get('open_orders'),
            price_per_steem,
            savings_withdraws,
            sbd_interest,
            gprops
        }
    },
    // mapDispatchToProps
    dispatch => ({
        claimRewards: (account) => {
            const username = account.get('name');
            const successCallback = () => {
                dispatch({type: 'global/GET_STATE', payload: {url: `@${username}/transfers`}})
            };

            const operation = {
                account: username,
                reward_steem: account.get('reward_steem_balance'),
                reward_sbd: account.get('reward_sbd_balance'),
                reward_vests: account.get('reward_vesting_balance')
            };

            dispatch(transaction.actions.broadcastOperation({
                type: 'claim_reward_balance',
                operation,
                successCallback,
            }))
        },
        convertToSteem: (e) => {
            e.preventDefault()
            const name = 'convertToSteem';
            dispatch(g.actions.showDialog({name}))
        },
        showChangePassword: (username) => {
            const name = 'changePassword';
            dispatch(g.actions.remove({key: name}));
            dispatch(g.actions.showDialog({name, params: {username}}))
        },
    })
)(UserWallet)
