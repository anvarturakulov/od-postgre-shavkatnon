import { ReferenceModel, TypeReference, TypeSECTION } from 'src/interfaces/reference.interface';
import { cashItem } from './cashItem';
import { Sequelize } from 'sequelize-typescript';
import { Reference } from 'src/references/reference.model';
import { StocksService } from 'src/stocks/stocks.service';

export const cash = async (
    data: any,
    startDate: number | null,
    endDate: number | null,
    sequelize: Sequelize,
    stocksService: StocksService
 ) => {
    
    let result:any[] = [];
    let filteredData:any[] = []
    
    if (data && data.length > 0 ) {
        filteredData = data.filter((item: Reference) => item?.typeReference == TypeReference.STORAGES && !item.refValues.markToDeleted)
                           .filter((item: Reference) => {
                                if ( item.refValues.typeSection == TypeSECTION.ACCOUNTANT || 
                                    item.refValues.typeSection == TypeSECTION.FILIAL ||
                                    item.refValues.typeSection == TypeSECTION.DELIVERY ) return true
                                return false
                           })
    }
    
    for (const item of filteredData) {
        let element = await cashItem(startDate, endDate, item.id, item.name, sequelize, stocksService)
        if (Object.keys(element).length) {
            result.push(element)
        }
    }
    
    return {
        reportType: 'CASH',
        reportStartDateToBackup: startDate,
        reportEndDateToBackup: endDate,
        values : [...result]
    }
} 

