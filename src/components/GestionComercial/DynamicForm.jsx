import React, { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import DynamicField from './DynamicField';
import LeadService from '../../services/leads/leadService';
import GestionComercialService from '../../services/leads/leadService';

const DynamicForm = forwardRef(({
    origenId,
    config: initialConfig = null,
    initialValues = {}, // This is the 'form' state from parent
    onStateChange,      // This is the 'setForm' or similar from parent
    onConfigLoaded,
    dataLoaders = {},
    slots = {},
    filter = null
}, ref) => {
    const [config, setConfig] = useState(initialConfig || []);
    const [loading, setLoading] = useState(!initialConfig && !!origenId);
    const [errors, setErrors] = useState({});

    const loadConfig = useCallback(async () => {
        if (!origenId || initialConfig) return;
        setLoading(true);
        try {
            // Use the correct service name (it's the same file but exported as default)
            const service = LeadService || GestionComercialService;
            const data = await service.consultarCombosOrigenes(origenId);
            const sortedData = (data || []).sort((a, b) => (a.Orden || 0) - (b.Orden || 0));
            setConfig(sortedData);
            if (onConfigLoaded) onConfigLoaded(sortedData);
        } catch (error) {
            console.error('DynamicForm:loadConfig', error);
        } finally {
            setLoading(false);
        }
    }, [origenId, initialConfig]);

    useEffect(() => {
        if (initialConfig) {
            const sortedData = [...initialConfig].sort((a, b) => (a.Orden || 0) - (b.Orden || 0));
            setConfig(sortedData);
            setLoading(false);
        } else {
            loadConfig();
        }
    }, [loadConfig, initialConfig]);

    // We no longer keep a local formState. 
    // We use initialValues (which is the parent's form state) directly.
    // This eliminates the circular sync loop.

    const handleFieldChange = (name, value) => {
        // Clear error when field changes
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }

        // Notify parent of the change
        if (onStateChange) {
            onStateChange({ [name]: value });
        }
    };

    const validate = useCallback(() => {
        const newErrors = {};
        const configToValidate = filter ? config.filter(filter) : config;

        configToValidate.forEach(field => {
            if (field.Requerido) {
                const value = initialValues[field.NombreCampo];
                if (value === undefined || value === null || String(value).trim() === '') {
                    newErrors[field.NombreCampo] = `${field.NombreVisual} es requerido`;
                }
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [config, initialValues, filter]);

    useImperativeHandle(ref, () => ({
        validate,
        getFormState: () => initialValues
    }));

    if (loading) {
        return <ActivityIndicator size="small" color="#337ab7" style={{ marginVertical: 20 }} />;
    }

    const filteredConfig = filter ? config.filter(filter) : config;

    if (filteredConfig.length === 0) {
        return null;
    }

    return (
        <View style={styles.container}>
            {filteredConfig.map((field) => {
                const fieldName = field.NombreCampo;

                if (slots[fieldName]) {
                    return (
                        <View key={field.CampoID || fieldName}>
                            {slots[fieldName]({
                                config: field,
                                value: initialValues[fieldName],
                                onChange: (val) => handleFieldChange(fieldName, val),
                                error: errors[fieldName]
                            })}
                        </View>
                    );
                }

                return (
                    <DynamicField
                        key={field.CampoID || fieldName}
                        config={field}
                        value={initialValues[fieldName]}
                        onChange={(val) => handleFieldChange(fieldName, val)}
                        onLoadData={dataLoaders[fieldName] || dataLoaders[field.TipoCampo]}
                        error={errors[fieldName]}
                    />
                );
            })}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
});

export default DynamicForm;
