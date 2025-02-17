import { SelectOborotProps } from './selectOborot.props';
import styles from './selectOborot.module.css';
import { useAppContext } from '@/app/context/app.context';
import { Maindata } from '@/app/context/app.context.interfaces';
import { Schet } from '@/app/interfaces/report.interface';
import { UserRoles } from '@/app/interfaces/general.interface';
import { isAdmins, isGuest } from '@/app/service/common/users';

export const SelectOborot = ({ label, visible , className, ...props }: SelectOborotProps): JSX.Element => {
    
    const {mainData, setMainData} = useAppContext();
    const {user} = mainData;

    let oborotTypeData = [
        { title: 'Харажатлар', schet: Schet.S20 },
        { title: 'Хом ашё', schet: Schet.S10 },
        { title: '21 счет', schet: Schet.S21 },
        { title: '23 счет', schet: Schet.S23 },
        { title: 'Тайёр махсулот', schet: Schet.S28 },
        { title: 'Мижозлар', schet: Schet.S40 },
        { title: 'Таъминотчи ва хамкорлар', schet: Schet.S60 },
        { title: 'Касса', schet: Schet.S50 },
        { title: 'Ходимлар иш хакиси', schet: Schet.S67 },
    ]
    
    if (isAdmins(user) || isGuest(user)) oborotTypeData.push({ title: 'Таъсисчилар', schet: Schet.S66 })
    if (isAdmins(user)) oborotTypeData.push({ title: 'Хамёнлар', schet: Schet.S68 })

    const changeElements = (e: React.FormEvent<HTMLSelectElement>, setMainData: Function | undefined, mainData: Maindata) => {
        let target = e.currentTarget;
        let {reportOption} = mainData;
        let dataSchet = target[target.selectedIndex].getAttribute('data-schet')
        
        let newObj = {
            ...reportOption,
            schet: dataSchet,
        }
        
        if (setMainData) {
            setMainData('reportOption', {...newObj})
        }
    }
    
    if (visible == false) return <></>
    
    return (
        <div className={styles.box}>

            {label !='' && <div className={styles.label}>{label}</div>}
            
            <select
                className={styles.select}
                {...props}
                onChange={(e) => changeElements(e, setMainData, mainData)}
            >   
                {oborotTypeData.map((item, key:number) => (
                    <>
                        <option 
                            value={item.title}
                            data-schet={item.schet}   
                            >
                                {item.title}
                        </option>
                    </>
                ))}
            </select>
        </div>
    );
};
