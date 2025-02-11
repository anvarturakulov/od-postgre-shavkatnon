'use client'
import styles from './userMenu.module.css'
import cn from 'classnames';
import {UserMenuProps} from './userMenu.props'
import { useEffect, useState } from 'react';
import { useAppContext } from '@/app/context/app.context';
import { defaultDocumentFormItems, defaultReportOptions } from '@/app/context/app.context.constants';
import { getKeyEnum } from '@/app/service/common/getKeyEnum';
import { ReportOptions } from '@/app/interfaces/report.interface';
import { MenuItem } from '@/app/interfaces/menu.interface';
import { ContentType, UserRoles } from '@/app/interfaces/general.interface';
import { getRandomID } from '@/app/service/documents/getRandomID';
import { getDefinedItemIdForReceiver, getDefinedItemIdForSender } from '../documents/docValues/doc.values.functions';
import { Section } from '../inform/section/section';
import { RefreshPanel } from '../inform/refreshPanel/refreshPanel';
import { Sklad } from '../inform/sklad/sklad';
import { IntervalWindow } from '../common/intervalWindow/intervalWindow';
import { Mayda } from '../documents/mayda/mayda';
import { Button } from '..';
import { Maindata } from '@/app/context/app.context.interfaces';
import MiniJournal from '../journals/miniJournal/miniJournal';
import { Norma } from '../inform/norma/norma';
import LoadingIco from './ico/loading.svg'

export default function UserMenu({menuData, className, ...props}:UserMenuProps):JSX.Element {
    
    const [menu, setMenu] = useState<Array<MenuItem>>([])
    const {mainData, setMainData} = useAppContext()
    const { user, informData, uploadingDashboard } = mainData;
    
    useEffect(()=>{
        // console.log(mainData.informData)
    },[mainData.informData])
    
    const role = mainData.user?.role;
    let storageIdFromUser = mainData.user?.storageId

    const onClickSubItem = (contentName: string, contentTitle: string, contentType: ContentType, mainData: Maindata) => {
        const keyItem = getKeyEnum(contentName, contentType)
        
        if (setMainData) {
            setMainData('activeMenuKey', keyItem);
            setMainData('contentType', contentType);
            setMainData('contentTitle', contentTitle);
            setMainData('contentName', contentName);
            setMainData('mainPage', false);
            setMainData('showDocumentWindow', true);
            setMainData('isNewDocument', true);
            setMainData('clearControlElements', true);

            if (contentType == 'document') {
                
                let defValue = {...defaultDocumentFormItems} 
                let num = getRandomID()
                let dateDoc = new Date();
                let dateStr = dateDoc.toISOString().split('T')[0]

                defValue.docNumber = num;
                if (role == UserRoles.TANDIR || role == UserRoles.HAMIRCHI) {
                    let dateNowPlussedInNumber = Date.now() + 14400000
                    defValue.date = dateNowPlussedInNumber
                } else {
                    defValue.date = Date.parse(dateStr)
                }

                defValue.documentType = contentName

                let definedItemIdForReceiver = getDefinedItemIdForReceiver(role, storageIdFromUser, contentName)
                let definedItemIdForSender = getDefinedItemIdForSender(role, storageIdFromUser, contentName)
                defValue.receiverId = definedItemIdForReceiver ? definedItemIdForReceiver : ''
                defValue.senderId = definedItemIdForSender ? definedItemIdForSender : ''

                defValue.firstWorkerId = mainData.definedTandirWorkers.firstWorker
                defValue.secondWorkerId = mainData.definedTandirWorkers.secondWorker
                defValue.thirdWorkerId = mainData.definedTandirWorkers.thirdWorker

                setMainData('currentDocument', {...defValue});
            }

            if (contentType == 'report') {
                let defValue = {...defaultReportOptions};
                const newReportOptions:ReportOptions = {
                    ...defValue,
                    startReport: false,
                }
                setMainData('reportOption', { ...newReportOptions });
            }

        };
    }

    const showMayda = (setMainData: Function | undefined) => {
        setMainData && setMainData('showMayda', true)
    }

    useEffect(()=> {
       setMenu(menuData)
    },[menuData])
    
    return (
        <>
            {menu.map((item, i) => (
            <>
            <ul className={styles.ul}>
                {item.subMenu.length && (
                    item.subMenu.map((elem,k)=> (
                        <>
                            {  role && elem.roles.includes(role) &&
                                <li 
                                    className={cn(styles.subItem)}
                                    onClick={() => onClickSubItem(elem.title, elem.description, elem.type, mainData)}
                                    key={elem.title}
                                >
                                    {elem.description? elem.description : elem.title}
                                </li>
                            }
                        </>
                    ))
                )}
            </ul>
            </>
                
            ))}

            {
                (
                    user?.role == UserRoles.HEADSECTION ||
                    user?.role == UserRoles.SELLER
                ) 
                && 
                <>
                    <Button appearance='primary' className={styles.maydaBtn} onClick={()=>showMayda(setMainData)}>Майда савдо</Button>
                    <Mayda/>
                </>
            }

            <div className={styles.journalBox}>
                { <MiniJournal/> }
            </div>
            <RefreshPanel/>

            {
                !uploadingDashboard &&
                <>
                    {
                        (
                            user?.role == UserRoles.HEADSECTION ||
                            user?.role == UserRoles.SELLER
                        ) 
                        &&
                        <>
                            <Section data={informData} sectionType='filial' currentSection ={storageIdFromUser}/>
                            {   
                                user.role == UserRoles.HEADSECTION &&
                                <Section data={informData} sectionType='delivery'/>
                            }
                        </>
                    }
                    {
                        user?.role == UserRoles.DELIVERY &&
                        <>
                            {/* <RefreshPanel/> */}
                            <Section data={informData} sectionType='delivery' currentSection ={storageIdFromUser}/>
                        </>
                    }
                    {
                        user?.role == UserRoles.KASSIR &&
                        <>
                            {/* <RefreshPanel/> */}
                            <Section data={informData} sectionType='buxgalter' currentSection ={storageIdFromUser}/>
                        </>
                    }
                </>
            }
            {
                uploadingDashboard &&
                <LoadingIco/>
            }

            <IntervalWindow/>
        </>
    )
}
