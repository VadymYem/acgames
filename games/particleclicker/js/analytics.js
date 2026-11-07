var analytics =
{
    enabled: false,

    screens:
    {
        main: 'Main screen',
        about: 'About',
        achievements: 'Achievements',
        info: 'Physics information'
    },

    events:
    {
        categoryResearch: 'Research',
        categoryHR: 'HR',
        categoryUpgrades: 'Upgrades',
        
        actionResearch: 'Research',
        actionHire: 'Hire',
        actionBuy: 'Buy'
    },
    
    init: function() {},
    
    sendScreen: function(type)
    {
        if (!analytics.enabled || typeof type === 'undefined') {
            return;
        }
        
        void('send', 'screenview', { 'screenName': type });
    },
    
    sendEvent: function(category, action, label, value)
    {
        if (!analytics.enabled || typeof category === 'undefined' || typeof action === 'undefined' || typeof label === 'undefined' || typeof value === 'undefined') {
            return;
        }
        
        //void('send', 'event', category, action, label, value, {'screenName': analytics.screens.main });
    }
};
