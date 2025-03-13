import { Sequelize } from 'sequelize-typescript';
import { QuerySimple, Schet, TypeQuery } from 'src/interfaces/report.interface';
import { BadRequestException } from '@nestjs/common';
import { PDKOL } from './queryComponents/PDKOL';
import { PDSUM } from './queryComponents/PDSUM';
import { PKKOL } from './queryComponents/PKKOL';
import { PKSUM } from './queryComponents/PKSUM';
import { TDKOL } from './queryComponents/TDKOL';
import { TDSUM } from './queryComponents/TDSUM';
import { TKKOL } from './queryComponents/TKKOL';
import { TKSUM } from './queryComponents/TKSUM';
import { COUNTCOME } from './queryComponents/COUNTCOME';
import { COUNTLEAVE } from './queryComponents/COUNTLEAVE';
import { TOTALCOME } from './queryComponents/TOTALCOME';
import { TOTALLEAVE } from './queryComponents/TOTALLEAVE';

export interface TotalResult {
    total: string | number | null;
}

export const query = async (
    schet: Schet | null,  
    typeQuery: TypeQuery | null,  
    startDate: number | null, 
    endDate: number | null, 
    firstSubcontoId: number | null, 
    secondSubcontoId: number | null,
    thirdSubcontoId: number | null, 
    sequelize: Sequelize): Promise<number> => {

    try {
        let replacements: { [key: string]: any } = {};
        let query: string = ''
        let stopQuery: boolean = false
        let middle: {[key: string]: any} = {query, replacements}
        
        const middleStart = ((typeQuery:TypeQuery | null) => {
            switch (typeQuery) {
                case TypeQuery.PDKOL: return {...PDKOL(schet, typeQuery, startDate, endDate, firstSubcontoId, secondSubcontoId, thirdSubcontoId)}
                case TypeQuery.PDSUM: return {...PDSUM(schet, typeQuery, startDate, endDate, firstSubcontoId, secondSubcontoId, thirdSubcontoId)}
                case TypeQuery.PKKOL: return {...PKKOL(schet, typeQuery, startDate, endDate, firstSubcontoId, secondSubcontoId, thirdSubcontoId)}
                case TypeQuery.PKSUM: return {...PKSUM(schet, typeQuery, startDate, endDate, firstSubcontoId, secondSubcontoId, thirdSubcontoId)}
                
                case TypeQuery.TDKOL: return {...TDKOL(schet, typeQuery, startDate, endDate, firstSubcontoId, secondSubcontoId, thirdSubcontoId)}
                case TypeQuery.TDSUM: return {...TDSUM(schet, typeQuery, startDate, endDate, firstSubcontoId, secondSubcontoId, thirdSubcontoId)}
                case TypeQuery.TKKOL: return {...TKKOL(schet, typeQuery, startDate, endDate, firstSubcontoId, secondSubcontoId, thirdSubcontoId)}
                case TypeQuery.TKSUM: return {...TKSUM(schet, typeQuery, startDate, endDate, firstSubcontoId, secondSubcontoId, thirdSubcontoId)}

                case TypeQuery.COUNTCOME: return {...COUNTCOME(schet, typeQuery, startDate, endDate, firstSubcontoId, secondSubcontoId, thirdSubcontoId)}
                case TypeQuery.COUNTLEAVE: return {...COUNTLEAVE(schet, typeQuery, startDate, endDate, firstSubcontoId, secondSubcontoId, thirdSubcontoId)}
                case TypeQuery.TOTALCOME: return {...TOTALCOME(schet, typeQuery, startDate, endDate, firstSubcontoId, secondSubcontoId, thirdSubcontoId)}
                case TypeQuery.TOTALLEAVE: return {...TOTALLEAVE(schet, typeQuery, startDate, endDate, firstSubcontoId, secondSubcontoId, thirdSubcontoId)}
            }
        })

        middle = {...middleStart(typeQuery)}

        query = middle.query
        replacements = {...middle.replacements}
        stopQuery = middle.stopQuery

        if (!stopQuery) {
            const [results] = await sequelize.query(query, {
                replacements,
                type: 'SELECT',
            })as [unknown[], unknown];

            const parsedObj = JSON.parse(JSON.stringify(results));
            const total = parsedObj?.total;
            return total != null ? Number(total) : 0;

        } else 
            return 0


    } catch (error) {
        throw new BadRequestException('Database error: ' + error.message);
    }
}