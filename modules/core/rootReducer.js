import { combineReducers } from 'redux';
import settings from './settings/reducer';
import ui from './ui/reducer';
import windows from './windows/reducer';
import ethereumNode from './ethereum_node/reducer';
import accounts from './accounts/reducer';
import swarm from './swarm/reducer';
import ipfs from './ipfs/reducer';

export default combineReducers({
    settings,
    accounts,
    ui,
    windows,
    ethereumNode,
    swarm,
    ipfs
});
