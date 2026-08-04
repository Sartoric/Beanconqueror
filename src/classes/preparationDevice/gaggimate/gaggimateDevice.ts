import { HttpClient } from '@angular/common/http';

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
      this.logError('deviceconnected debug', response);
      return response.status === 200;
    } catch (error) {
      this.logError('Error in connection:', error);
      return null;
    }
  }

  public async getLastShotId(): Promise<number> {
    try {
      const options = {
        url: this.connectionURL + '/api/history/latest',
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
    brewFlow.weight = [];
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
}

export class GaggimateParams implements IGaggimateParams {
  public chosenProfileId: number;
  public chosenProfileName: string;
  public shotId: number;

  constructor() {
    this.chosenProfileId = 1;
    this.chosenProfileName = '';
    this.shotId = 1;
  }
}
