import { Injectable, Inject } from '@nestjs/common';
import { Document } from './document.model';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { DocValues } from 'src/docValues/docValues.model';
import { DocTableItems } from 'src/docTableItems/docTableItems.model';
import { DocSTATUS, DocumentType } from 'src/interfaces/document.interface';
import { UpdateCreateDocumentDto } from './dto/updateCreateDocument.dto';
import { Sequelize } from 'sequelize-typescript';
import { Entry } from 'src/entries/entry.model';
import { prepareEntrysList } from './helper/entry/prepareEntrysList';
import { console } from 'inspector';
import { convertJsonDocs } from './helper/entry/convertJsonDoc';
const { Op } = require('sequelize');
const fs = require('fs');

@Injectable()
export class DocumentsService {

    constructor(
        @InjectConnection() private readonly sequelize: Sequelize,
        @InjectModel(Document) private documentRepository: typeof Document,
        @InjectModel(DocValues) private docValuesRepository: typeof DocValues,
        @InjectModel(DocTableItems) private docTableItemsRepository: typeof DocTableItems,
        @InjectModel(Entry) private entryRepository: typeof Entry
    ) {}

    async getAllDocuments() {
        const documents = await this.documentRepository.findAll({include: [DocValues, DocTableItems ]})
        return documents
    }

    async getAllDocumentsByType(documentType: DocumentType) {
        const documents = await this.documentRepository.findAll({where: {documentType}, include: [DocValues, DocTableItems]})
        return documents
    }

    async getAllDocumentsByTypeForDate(documentType, dateStart: number, dateEnd: number) {
        const documents = await this.documentRepository.findAll(
            {
                where: {
                        documentType, 
                        date: { 
                            [Op.gte]: dateStart,
                            [Op.lte]: dateEnd
                        },
                    }, 
                include: [DocValues, DocTableItems]
            }
        )
        return documents 
    }

    async getDocumentById(id: number) {
        const document = await this.documentRepository.findOne({where: {id}, include: [DocValues, DocTableItems]})
        return document
    }

    async updateDocumentById(id: number, dto:UpdateCreateDocumentDto) {
        const document = await this.documentRepository.findOne({where: {id}, include: [DocValues, DocTableItems]})
    
        const transaction = await this.sequelize.transaction();
        try {
            if (document) {
                document.date = dto.date
                
                if (document.docValues) {
                    await document.docValues.update({ ...dto.docValues });
                } else {
                    await this.docValuesRepository.create({ ...dto.docValues, docId: document.id });
                }

                await document.save()
                await this.docTableItemsRepository.destroy({where: {docId:document.id}})

                const items = [...dto.docTableItems]

                // if (items && items.length > 0 && items[0].analiticId != -1 ) {
                //     for (const item of items) {
                //         const docTableItem = await this.docTableItemsRepository.create({
                //             ...item,
                //             docId: document.id
                //         })
                //     }
                // }

                if (items && items.length > 0 && items[0].analiticId != -1) {
                    await Promise.all(
                        items.map(item =>
                            this.docTableItemsRepository.create({
                                ...item,
                                docId: document.id,
                            })
                        )
                    );
                }

            }

            await transaction.commit();
            return document

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async createDocument(dto:UpdateCreateDocumentDto) {
        
        const transaction = await this.sequelize.transaction();
        try {
            const document = await this.documentRepository.create({
                date:dto.date, 
                documentType: dto.documentType, 
                docStatus: DocSTATUS.OPEN,
                userId: dto.userId ? dto.userId: 0
            })

            const docValues = await this.docValuesRepository.create({
                ...dto.docValues,
                docId: document.id
            })

            const items = [...dto.docTableItems]

            if (items && items.length > 0 && items[0].analiticId != -1 ) {
                for (const item of items) {
                    const docTableItem = await this.docTableItemsRepository.create({
                        ...item,
                        docId: document.id
                    })
                }
            }

            if (dto.docStatus == DocSTATUS.PROVEDEN) {
                const doc = await this.documentRepository.findOne({where: {id: document.id}, include: [DocValues, DocTableItems]})
                if (doc) {
                    const entrysList = [...prepareEntrysList(doc, true)]
                    if (entrysList.length > 0 ) {
                        for (const item of entrysList) {
                            const entry = await this.entryRepository.create({
                                ...item,
                            })
                        }
                    }
                    doc.docStatus = DocSTATUS.PROVEDEN
                    await doc.save()
                }
                
            }

            await transaction.commit();
            return document

        } catch (error) {
            await transaction.rollback();
            throw error;
        }

    }

    async markToDeleteById(id: number) {
        const document = await this.documentRepository.findOne({where: {id}, include: [Entry]})
        
        const transaction = await this.sequelize.transaction();
        
        try {
            let newStatus: DocSTATUS = DocSTATUS.DELETED
            if (document) {
                if (document.docStatus == DocSTATUS.DELETED) newStatus = DocSTATUS.OPEN
                if (document.docStatus == DocSTATUS.OPEN) newStatus = DocSTATUS.DELETED
                if (document.docStatus == DocSTATUS.PROVEDEN) newStatus = DocSTATUS.DELETED
                                
                await this.entryRepository.destroy({where: {docId:document.id}})
                // Anvar Bu erda Entrys ni uchirish kodini ham yozish kerak
                document.docStatus = newStatus
                await document.save()
            }
                await transaction.commit();
                return document

        } catch (error) {
            await transaction.rollback();
            throw error;
        }

    }

    async setProvodka(id: number) {
        const document = await this.documentRepository.findOne({where: {id}, include: [{ all: true }]})
        const transaction = await this.sequelize.transaction();
        try {
            if (document && document.docStatus != DocSTATUS.PROVEDEN) {
                const entrysList = [...prepareEntrysList(document)]
                if (entrysList.length > 0 ) {
                    for (const item of entrysList) {
                        const entry = await this.entryRepository.create({
                            ...item,
                        })
                    }
                }
                document.docStatus = DocSTATUS.PROVEDEN
                await document.save()
            }

            await transaction.commit();
            return document

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async createMany(list: any) {
        
        // const transaction = await this.sequelize.transaction();
        
        if (list && list.length) {
            for (const item of list) {
                let element = convertJsonDocs(item)
                const dto = {...element}
                try {
                    const document = await this.documentRepository.create({
                        date:dto.date, 
                        documentType: dto.documentType, 
                        docStatus: DocSTATUS.OPEN,
                        userId: dto.userId ? dto.userId: 0
                    })
                    console.log(dto.docValues)
                    const docValues = await this.docValuesRepository.create({
                        ...dto.docValues,
                        docId: document.id
                    })
        
                    const items = [...dto.docTableItems]
        
                    if (items && items.length > 0 && items[0].analiticId != -1 ) {
                        for (const item of items) {
                            const docTableItem = await this.docTableItemsRepository.create({
                                ...item,
                                docId: document.id
                            })
                        }
                    }
        
                    // if (dto.docStatus == DocSTATUS.PROVEDEN) {
                    //     const doc = await this.documentRepository.findOne({where: {id: document.id}, include: [DocValues, DocTableItems]})
                    //     if (doc) {
                    //         const entrysList = [...prepareEntrysList(doc, true)]
                    //         if (entrysList.length > 0 ) {
                    //             for (const item of entrysList) {
                    //                 const entry = await this.entryRepository.create({
                    //                     ...item,
                    //                 })
                    //             }
                    //         }
                    //         doc.docStatus = DocSTATUS.PROVEDEN
                    //         await doc.save()
                    //     }
                        
                    // }
        
                    // await transaction.commit();
        
                } catch (err) {
                    // await transaction.rollback();
                    // throw new Error(`Failed to create documents: ${err.message}`);
                }
            }
        }
        
    }


    async pereProvodka() {
        const documents = await this.documentRepository.findAll({include: [DocValues, DocTableItems ]})
        for (const document of documents) {
            if (document ) {
                await this.entryRepository.destroy({where: {docId:document.id}})
                
                const entrysList = [...prepareEntrysList(document, true)]
                if (entrysList.length > 0 ) {
                    for (const item of entrysList) {
                        const entry = await this.entryRepository.create({
                            ...item,
                        })
                    }

                } else throw new Error(`Entrys not: ${document.docValues.senderId}`);

            }
        }
        
    }
}
