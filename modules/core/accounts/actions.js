import { ipcMain } from 'electron';
import Settings from '../../settings';
import Windows from '../../windows';
import logger from '../../utils/logger';
import path from 'path';
import fs from 'fs';
import { startMainWindow } from '../windows/actions';
import { quitApp } from '../ui/actions';

const accountsLog = logger.create('accounts');

export function syncAccounts() {
    return async (dispatch, getState) => {
        const accounts = await Settings.accounts;
        return dispatch({ type: '[ETHEREUM]:ACCOUNTS:SYNC', accounts });
    }
};

export function handleOnboarding() {
    return async (dispatch, getState) => {
        await dispatch(syncAccounts());

        if (getState().accounts.active.length > 0) {
            dispatch({ type: '[ETHEREUM]:ONBOARDING:SKIP' });
            dispatch(startMainWindow());
            return;
        }

        dispatch({ type: '[ETHEREUM]:ONBOARDING:START' });

        const onboardingWindow = Windows.createPopup('onboardingScreen');
        onboardingWindow.on('closed', () => dispatch(quitApp()));

        ipcMain.on('onBoarding_launchApp', () => {
            onboardingWindow.removeAllListeners('closed');
            onboardingWindow.close();

            ipcMain.removeAllListeners('onBoarding_launchApp');

            dispatch({ type: '[ETHEREUM]:ONBOARDING:FINISHED' });

            dispatch(startMainWindow());
        });
    }
};

export function saveNewWallet(walletFileName, walletJSON) {
    return (dispatch, getState) => {
        const filePath = path.join(Settings.keystorePath, walletFileName);
        const fileData = JSON.stringify(walletJSON)

        fs.writeFile(filePath, fileData, function(error) {
            if (error) {
                accountsLog.error(error);
                return;
            }

            accountsLog.info(`New account saved to ${filePath}`);
        }); 

        const wallet = walletJSON;
        dispatch({ type: '[ETHEREUM]:ACCOUNTS:NEW', wallet });
    }
};