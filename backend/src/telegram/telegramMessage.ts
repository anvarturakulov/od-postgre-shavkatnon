import { CreateDocumentDto } from '../document/dto/document.create.dto';
import { User } from '../auth/models/user.model';
import { UserRoles } from '../auth/dto/auth.dto';
import { getDescriptionDocument } from '../data/menu';
import { Reference, ReferenceDocument } from 'src/reference/models/referense.model';
import { DocumentType } from 'src/interfaces/document.interface';
import TelegramBot from 'node-telegram-bot-api';
import { QueryWorker } from 'src/interfaces/report.interface';
import { ReferenceService } from 'src/reference/reference.service';
import { ReportService } from 'src/report/report.service';

// const TelegramBot = require('node-telegram-bot-api');

enum TelegramChanelsIds {
  // Production = '-1002006894052',
  // MainSklad = '-1002012045551',
  Halqobod = '-1002271858434', //+++
  Chashma = '-1002479917847', //+++
  Konteyner = '-1002437963219', //+++
  All = '-1002280389944', //++
  ZpChanel = '-1002279595323', //++
  // GlBux = '-1002123973259',
  Delivery = '-1002422160049' //+++

}

export type ReferencesForTelegramMessage = {
  sender: Reference | undefined,
  receiver: Reference | undefined,
  analitic: Reference | undefined,
  firstWorker: Reference | undefined,
  secondWorker: Reference | undefined,
  thirdWorker: Reference | undefined,
}

// export const numberValue = (price: number): string => price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

export const numberValue = (price: number): string => {
  let newPrice = Math.round(price * 10) / 10;
  return newPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
};

const changeUserName = (userName:string): string => {
  switch (userName) {
    case 'Фарида': return 'Умар ака';
    case 'Сухроб': return 'Лайло';
    case 'Жонибек': return 'Шахзод';
    default: return userName;
  }
}

const prepareCheck = (body: CreateDocumentDto, references: ReferencesForTelegramMessage, newDocument: boolean, messageInDeleting: string) => {

  let title = newDocument ? 'ШАВКАТ НОН" - ЧЕК' : 'ЧЕК УЗГАРТИРИЛДИ'
  if (messageInDeleting && messageInDeleting.length > 0) title = messageInDeleting
  let dateDoc = new Date(body.date).toLocaleDateString('ru-RU')
  let user = body.user ? `Ходим --- ${changeUserName(body.user)}` : ''
  let date = dateDoc ? `Сана --- ${dateDoc}` : ''
  let hodim = body.documentType == DocumentType.LeaveHalfstuff ? 'Хамирчи' : 'Ёпувчи';
  let doc = getDescriptionDocument(body.documentType) ? `Хужжат тури --- ${getDescriptionDocument(body.documentType)}` : '';

  let receiver = references.receiver?.name ? `Олувчи -- - ${references.receiver.name}` : ''
  let analitic = references.analitic?.name ? `Аналитика -- - ${references.analitic.name}` : ''
  let sender = references.sender?.name ? `Жунатувчи -- - ${references.sender.name}` : ''
  let firstWorker = references.firstWorker?.name ? `( ${hodim} --- ${references.firstWorker.name}` : ''
  let secondWorker = references.secondWorker?.name ? `Зувалачи бир --- ${references.secondWorker.name}` : ''
  let thirdWorker = references.thirdWorker?.name ? `Зувалачи икки --- ${references.thirdWorker.name} )` : ''

  let count = body.count > 0 ? `Сон --- ${numberValue(body.count)} та` : ''
  let price = body.price > 0 ? `Нарх --- ${numberValue(body.price)}` : ''
  let total = body.total > 0 ? `Сумма --- ${numberValue(body.total)}` : ''
  let cashFromPartner = body.cashFromPartner > 0 ? `Хамкордан олинган пул --- ${numberValue(body.cashFromPartner)}` : ''
  let comment = body.comment ? `Изох: ${body.comment} ${firstWorker} ${secondWorker} ${thirdWorker}` : ''
  if (!comment) comment = `Изох: ${firstWorker} ${secondWorker} ${thirdWorker}`

  return (
    `==========================
      ${title}      
   =========================
   ${user}
   ${doc}
   ${date} № - ${body.docNumber}
   --------------------------------------------
   ${receiver}
   ${sender}
   ${analitic}
   ${count} ${price}
   ${total} 
   ${comment}
   ==========================
   МЕХНАТИНГИЗ УЧУН РАХМАТ!
   ==========================
  `
  )
}

const prepareCheckForZP = (body: CreateDocumentDto, references: ReferencesForTelegramMessage, newDocument: boolean, messageInDeleting: string) => {

  let title: string
  const titleForCalculate = 'ИШ ХАКИ ХИСОБЛАНДИ'
  const titleForCalculateChange = 'ИШ ХАКИ УЗГАРТИРИЛДИ'
  const titleForPayment = 'ИШ ХАКИ ТУЛАНДИ'
  const titleForPaymentChange = 'ТУЛОВ УЗГАРТИРИЛДИ'

  if (body.documentType == DocumentType.ZpCalculate) {
    title = newDocument ? titleForCalculate : titleForCalculateChange
  }

  if (body.documentType == DocumentType.LeaveCash) {
    title = newDocument ? titleForPayment : titleForPaymentChange
  }

  if (messageInDeleting && messageInDeleting.length > 0) title = messageInDeleting

  let dateDoc = new Date(body.date).toLocaleDateString('ru-RU')
  let date = dateDoc ? `Сана --- ${dateDoc}` : ''

  let receiver = references.receiver?.name ? `Цех -- - ${references.receiver.name}` : ''
  let analitic = references.analitic?.name ? `Ходим -- - ${references.analitic.name}` : ''

  let total = body.total > 0 ? `Сумма --- ${numberValue(body.total)}` : ''

  let comment = body.comment ? `Изох: ${body.comment}` : ''

  return (
    `==========================
      ${title}      
   =========================
   ${date} № - ${body.docNumber}
   --------------------------------------------
   ${receiver}
   ${analitic}
   ${total} 
   ${comment}
   ==========================
   МЕХНАТИНГИЗ УЧУН РАХМАТ!
   ==========================
  `
  )
}

export const sendMessageToChanel = (body: CreateDocumentDto, user: User, references: ReferencesForTelegramMessage, newDocument: boolean, messageInDeleting: string, bot: TelegramBot) => {
  
  let firstChadId = ''

  if (!user) return

  if (body.documentType == DocumentType.ZpCalculate) firstChadId = TelegramChanelsIds.ZpChanel

  if (user.role == UserRoles.HEADSECTION || user.role == UserRoles.SELLER) {
    if (user.storageId == '659ce07f523a48fdeb6ad8c3') firstChadId = TelegramChanelsIds.Chashma
    if (user.storageId == '659ce094523a48fdeb6ad8c7') firstChadId = TelegramChanelsIds.Halqobod
    if (user.storageId == '659ce0ab523a48fdeb6ad8cb') firstChadId = TelegramChanelsIds.Konteyner
  }

  if (user?.role == UserRoles.DELIVERY) firstChadId = TelegramChanelsIds.Delivery

  let secondChatId = TelegramChanelsIds.All
  if (firstChadId) {
    bot.sendMessage(firstChadId, prepareCheck(body, references, newDocument, messageInDeleting));
  }
  bot.sendMessage(secondChatId, prepareCheck(body, references, newDocument, messageInDeleting));

  if (body.documentType == DocumentType.ZpCalculate 
    || ( body.documentType == DocumentType.LeaveCash && body.isWorker)) {
    try {
      if (references.analitic.telegramId) {
        bot.sendMessage(references.analitic.telegramId, prepareCheckForZP(body, references, newDocument, messageInDeleting));
      }
    } catch {
    }
  }
}


export const listiningBot = async(bot: TelegramBot, referenceService: ReferenceService, reportService: ReportService) => {
  
} 
