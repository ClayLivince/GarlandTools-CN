gt.i18n = {
    en: {
        CopyrightAgreement: "Copyright Agreement",
        CopyrightAgreementText: "FINAL FANTASY XIV © 2010 - 2024 SQUARE ENIX CO., LTD. All Rights Reserved. I fully understand the vocalizations are under Square Enix's copyright protection, and I promise I am only trying to have a preview of game data and not going to use it in any way that violates the copyright regulations in my region."
    },

    ja: {
        CopyrightAgreement: "著作権規約",
        CopyrightAgreementText: "FINAL FANTASY XIV © 2010 - 2024 SQUARE ENIX CO., LTD. All Rights Reserved. ファイナルファンタジーXIV 2010 - 2024 株式会社スクウェア・エニックス 無断転載を禁じます。 私は音声がスクウェア・エニックスの著作権保護下にあることを十分に理解しており、ゲーム データをプレビューするだけであり、地域の著作権規制に違反する方法で使用しないことを約束します。"

    },

    fr: {
        CopyrightAgreement: "Accord de droits d'auteur",
        CopyrightAgreementText: "FINAL FANTASY XIV © 2010 - 2024 SQUARE ENIX CO., LTD. All Rights Reserved. Tous droits réservés. Je comprends parfaitement que les vocalisations sont protégées par les droits d'auteur de Square Enix, et je promets que j'essaie uniquement d'avoir un aperçu des données du jeu et que je ne les utiliserai pas d'une manière qui viole les réglementations sur les droits d'auteur dans ma région."

    },

    de: {
        CopyrightAgreement: "Urheberrechtsvereinbarung",
        CopyrightAgreementText: "FINAL FANTASY XIV © 2010 - 2024 SQUARE ENIX CO., LTD. All Rights Reserved. Alle Rechte vorbehalten. Ich verstehe voll und ganz, dass die Lautäußerungen dem Urheberrechtsschutz von Square Enix unterliegen, und ich verspreche, dass ich nur versuche, eine Vorschau der Spieldaten zu erhalten und sie nicht in einer Weise zu verwenden, die gegen die Urheberrechtsbestimmungen in meiner Region verstößt."
    },

    chs: {

    },

    kr: {

    },

    get: function(index){
        let trans = gt.i18n[gt.settings.data.lang];
        if (trans){
            let tran = trans[index];
            if (tran){
                return tran;
            } else {
                if (gt.i18n.en[index]) {
                    return gt.i18n.en[index];
                }
            }
        }
        return index;
    }
};
