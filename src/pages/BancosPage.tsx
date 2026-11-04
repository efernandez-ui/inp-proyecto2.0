import React from 'react';
import CopyToClipboardButton from '../components/CopyToClipboardButton';
interface BankDetail {
    label: string;
    value: string | undefined | null;
}
interface Bank {
    name: string;
    logo: string;
    details: BankDetail[];
}
const banks: Bank[] = [
    {
        name: 'Banco Nación',
        logo: '/images/banks/logo_bconacion.jpg',
        details: [
            { label: 'Tipo de cuenta', value: 'Cta.Cte. Pesos ($)' },
            { label: 'Nro de cuenta', value: '428 00156/60' },
            { label: 'C.B.U.', value: '01104282 20042800156606' },
            { label: 'Alias', value: 'INTERCAP.NACION.CC' },
            { label: 'Suc', value: '2900' }
        ]
    },
    {
        name: 'Banco Credicoop',
        logo: '/images/banks/logo_bcocredicoop.jpg',
        details: [
            { label: 'Tipo de cuenta', value: 'Cta.Cte. Pesos ($)' },
            { label: 'Nro de cuenta', value: '388 8948/0' },
            { label: 'C.B.U.', value: '19103888 55038800894800' },
            { label: 'Alias', value: 'INTERCAP.CREDI.CC' },
            { label: 'Suc', value: '388' }
        ]
    },
    // {
    //     name: 'Banco ICBC',
    //     logo: '/images/banks/logo_bancoicbc.jpg',
    //     details: [
    //         { label: 'Tipo de cuenta', value: 'Cta.Cte. Pesos ($)' },
    //         { label: 'Nro de cuenta', value: '0827/02100542/20' },
    //         { label: 'C.B.U.', value: '01508275 02000100542206' },
    //         { label: 'Alias', value: 'INTERCAP.ICBC.CC' },
    //         { label: 'Suc', value: '827' }
    //     ]
    // },
    // {
    //     name: 'Banco Santa Fe',
    //     logo: '/images/banks/logo_bcosantafe.jpg',
    //     details: [
    //         { label: 'Tipo de cuenta', value: 'C.A. Pesos ($)' },
    //         { label: 'Nro de cuenta', value: '536 - 030 - 6670/01' },
    //         { label: 'C.B.U.', value: '33005360 25360006670012' },
    //         { label: 'Alias', value: 'INTERCAP.NBSF.CA' },
    //         { label: 'Suc', value: '536' }
    //     ]
    // },
    {
        name: 'Banco Galicia',
        logo: '/images/banks/logo_bcogalicia.jpg',
        details: [
            { label: 'Tipo de cuenta', value: 'Cta.Cte. Pesos ($)' },
            { label: 'Nro de cuenta', value: '2215-2-345-9' },
            { label: 'C.B.U.', value: '00703459 20000002215293' },
            { label: 'Alias', value: 'INTERCAP.GALICIA.CC' },
            { label: 'Suc', value: '345' }
        ]
    },
    {
        name: 'Banco Macro',
        logo: '/images/banks/logo_bcomacro.jpg',
        details: [
            { label: 'Tipo de cuenta', value: 'Cta.Cte. Pesos ($)' },
            { label: 'Nro de cuenta', value: '3-364-0000613672-7' },
            { label: 'C.B.U.', value: '2850364-4 3000006136727-3' },
            { label: 'Alias', value: 'INTERCAP.MACRO.CC' },
            { label: 'Suc', value: '787' }
        ]
    },
    {
        name: 'Mercadopago',
        logo: '/images/banks/logo_mercadopago.jpg',
        details: [
            { label: 'Tipo de cuenta', value: 'Billetera Virtual' },
            { label: 'C.V.U.', value: '0000003100078331726474' },
            { label: 'Alias', value: 'intercapsrl.mp' }
        ]
    }
];
const getAllBankDetailsText = (bank: Bank): string => {
    let detailsText = `${bank.name}\nEntidad: ${bank.name}\n`;
    bank.details.forEach(detail => {
        if (detail.value) {
            detailsText += `${detail.label}: ${detail.value}\n`;
        }
    });
    return detailsText.trim();
};
const BankCard: React.FC<{ bank: Bank }> = ({ bank }) => {
    const allDetailsText = getAllBankDetailsText(bank);
    return (
        <div
            className="group relative bg-white p-6 rounded-xl shadow-lg border border-gray-100
                       transition-all duration-300 ease-in-out cursor-default
                       hover:shadow-xl hover:-translate-y-1"
        >
            <div className="flex flex-col items-center mb-4">
                <div className="w-full h-32 flex items-center justify-center bg-white mb-4">
                    <img
                        src={bank.logo}
                        alt={`Logo ${bank.name}`}
                        className="max-w-full max-h-full object-contain p-2"
                    />
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl text-center font-extrabold text-gray-800 leading-tight mt-4">
                    {bank.name}
                </h2>
                <div className="mt-3">
                    <CopyToClipboardButton
                        textToCopy={allDetailsText}
                        label="todos los datos"
                        className=""
                        iconSize={20}
                    />
                </div>
            </div>
            <hr className="border-gray-100 mb-4" />
            <div className="space-y-1 text-sm text-gray-700">
                {bank.details.map((detail, index) => (
                    (detail.value) && (
                        <p key={index} className="flex items-center">
                            <span className="font-semibold mr-1">{detail.label}:</span>
                            {detail.value}
                            {['C.B.U.', 'C.V.U.', 'Alias'].includes(detail.label) && (
                                <CopyToClipboardButton
                                    textToCopy={detail.value}
                                    label={detail.label}
                                />
                            )}
                        </p>
                    )
                ))}
            </div>
        </div>
    );
};
const BancosPage: React.FC = () => {
    return (
        <div className="p-4 sm:p-6 md:p-8">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2 border-b-2 border-indigo-500 inline-block pb-1">
                Bancos
            </h1>
            <p className="text-lg text-gray-600 mb-10">
                Entidades a su servicio para facilitar sus transacciones.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {banks.map((bank, index) => (
                    <BankCard key={index} bank={bank} />
                ))}
            </div>
        </div>
    );
};
export default BancosPage;