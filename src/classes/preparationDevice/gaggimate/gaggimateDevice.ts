import { HttpClient } from '@angular/common/http';

import { time } from 'ionicons/icons';

import { CapacitorHttp, HttpResponse } from '@capacitor/core';
import Api, { ActionType, ProfileIdent } from '@meticulous-home/espresso-api';
import {
  HistoryEntry,
  HistoryListingEntry,
} from '@meticulous-home/espresso-api/dist/types';
import { Profile } from '@meticulous-home/espresso-profile';
import moment from 'moment';

import { IGaggimateParams } from '../../../interfaces/preparationDevices/gaggimate/iGaggimateParams';
import { UILog } from '../../../services/uiLog';
import {
  BrewFlow,
  IBrewPressureFlow,
  IBrewRealtimeWaterFlow,
  IBrewTemperatureFlow,
  IBrewWeightFlow,
} from '../../brew/brewFlow';
import { Preparation } from '../../preparation/preparation';
import { Move2Params } from '../move2/move2Device';
import { PreparationDevice } from '../preparationDevice';
import { GaggimateShotData } from './gaggimateShotData';

declare var cordova;

export class GaggimateDevice extends PreparationDevice {
  private connectionURL: string;
  private _isConnected = false;
  private gaggimateShotData: GaggimateShotData = undefined;
  private metApi: Api = undefined;

  constructor(
    protected httpClient: HttpClient,
    _preparation: Preparation,
  ) {
    super(httpClient, _preparation);
    this.gaggimateShotData = undefined;
    this.connectionURL = this.getPreparation().connectedPreparationDevice.url;
    this.metApi = new Api(
      undefined,
      _preparation.connectedPreparationDevice.url,
    );
    if (typeof cordova !== 'undefined') {
      //
    }
  }

  public isConnected() {
    return this._isConnected;
  }

  async deviceConnected(): Promise<boolean> {
    try {
      const options = {
        url: this.connectionURL + '/api/settings',
        connectTimeout: 5000,
      };
      const response: HttpResponse = await CapacitorHttp.get(options);
      return response.status === 200;
    } catch (error) {
      this.logError('Error in connection:', error);
      return null;
    }
  }

  public async getLastShotId(): Promise<number> {
    try {
      const options = {
        url: this.connectionURL + '/api/history/latestShotId',
        connectTimeout: 5000,
      };
      const response: HttpResponse = await CapacitorHttp.get(options);
      const responseJSON = await response.data;
      return Number(responseJSON.id);
    } catch (error) {
      this.logError('Gaggimate - Error in getLastShotId():', error);
      return null;
    }
  }

  public static returnBrewFlowForShotData(_shotData) {
    const brewFlow = new BrewFlow();
    const newMoment = moment(new Date()).startOf('day');

    _shotData.rawdata.forEach((row) => {
      const shotEntryTime = newMoment.clone().add(row[0] / 1000, 'seconds');
      const timestamp = shotEntryTime.format('HH:mm:ss.SSS');

      // const brewTimeMs = row[0];
      // const brewTimeStr = (brewTimeMs / 1000).toFixed(2);
      // const timestampStr = new Date(brewTimeMs).toISOString();

      brewFlow.weight.push({
        timestamp: timestamp,
        brew_time: '',
        actual_weight: row[4],
        old_weight: 0,
        actual_smoothed_weight: 0,
        old_smoothed_weight: 0,
        calculated_real_flow: 0,
        not_mutated_weight: 0,
      });

      brewFlow.pressureFlow.push({
        actual_pressure: row[2],
        old_pressure: 0,
        brew_time: '',
        timestamp: timestamp,
      });

      brewFlow.waterFlow.push({
        value: row[3],
        brew_time: '',
        timestamp: timestamp,
      });

      brewFlow.temperatureFlow.push({
        actual_temperature: row[1],
        old_temperature: 0,
        brew_time: '',
        timestamp: timestamp,
      });
    });
    return brewFlow;
  }

  public async getShotData(_id: number) {
    const options = {
      url: this.connectionURL + '/api/history/get?id=' + _id,
      connectTimeout: 5000,
    };
    const response: HttpResponse = await CapacitorHttp.get(options);
    const responseJSON = await response.data;
    if (response.status === 404) {
      return null;
    }
    return responseJSON;
  }
  catch(error) {
    this.logError('Error in getShotData():', error);
    return null;
  }

  private logError(...args: any[]) {
    UILog.getInstance().error('Gaggimate device:', ...args);
  }

  public getLatestShotsToImport(): number {
    const customParams = this.getPreparation()?.connectedPreparationDevice
      ?.customParams as GaggimateParams;
    return customParams?.latestShotsToImport
      ? customParams.latestShotsToImport
      : 3;
  }
}

export class GaggimateParams implements IGaggimateParams {
  public chosenProfileId: string;
  public chosenProfileName: string;
  public shotId: number;
  public latestShotsToImport: number;

  constructor() {
    this.chosenProfileId = '';
    this.chosenProfileName = '';
    this.shotId = 0;
    this.latestShotsToImport = 1;
  }
}
