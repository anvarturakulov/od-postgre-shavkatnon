import { Schet } from '@/app/interfaces/report.interface';
import { getTypeDocumentForReference } from './getTypeDocumentForReference';
import { Maindata } from '@/app/context/app.context.interfaces';
import { setPriceAndBalance } from './setPriceAndBalance';
import { getSchetForQuery } from './getSchetForQuery';

export const getPriceAndBalance = (
  mainData: Maindata,
  setMainData: Function | undefined,
  firstSubcontoId: number,
  secondSubcontoId: number| undefined,
  endDate: number,
  forTable: boolean,
  indexTableItem: number,
) => {

  const { contentName } = mainData.window;
  endDate = endDate + 10000;

  let schet = undefined
  let typeDocumentForReference = getSchetForQuery(contentName);

  if (typeDocumentForReference == 'MATERIAL') {
    schet = Schet.S10
  }
  if (typeDocumentForReference == 'HALFSTUFF') {
    schet = Schet.S21;
  }
  if (typeDocumentForReference == 'PRODUCT') {
    schet = Schet.S28
  }

  if (schet) {
    setPriceAndBalance(mainData, setMainData, schet, firstSubcontoId, secondSubcontoId, endDate, forTable, indexTableItem)
  }
  
}

