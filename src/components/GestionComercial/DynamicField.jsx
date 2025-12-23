import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { CustomInput, COLORS } from './FormComponents';
import CustomModalPicker from '../../assets/common/CustomModalPicker';

const DynamicField = ({ config, value, onChange, onLoadData, error }) => {
    if (!config) return null;

    const {
        NombreVisual,
        NombreCampo,
        TipoCampo,
        TipoDatoID,
        Requerido,
        Placeholder,
        EsLista,
        ArrayLista
    } = config;

    // Mapping based on Web ControllerGestion.js
    // 1: Date, 2: Int, 3: Decimal, 4: Text, 5: TextArea, 6: Select, 7: Bool

    // Type 6: Select / List
    if (TipoDatoID === 6 || EsLista) {
        // If ArrayLista is provided directly in config (as per web implementation where it's embedded)
        const loadData = ArrayLista ? () => Promise.resolve(ArrayLista) : (onLoadData || (() => Promise.resolve([])));

        return (
            <CustomModalPicker
                label={NombreVisual}
                required={Requerido}
                selectedValue={value}
                onValueChange={onChange}
                placeholder={Placeholder || "Seleccione..."}
                onLoadData={loadData}
                hasSearch={true}
                error={error}
            />
        );
    }

    // Type 7: Boolean
    if (TipoDatoID === 7 || TipoCampo === 'Boolean' || TipoCampo === 'Bit') {
        return (
            <View style={styles.switchContainer}>
                <View style={styles.labelContainer}>
                    <Text style={styles.label}>{NombreVisual}</Text>
                    {Requerido && <Text style={styles.required}>*</Text>}
                </View>
                <Switch
                    value={!!value}
                    onValueChange={onChange}
                    trackColor={{ false: "#D1D5DB", true: COLORS.secondary }}
                    thumbColor={value ? COLORS.primary : "#F3F4F6"}
                />
            </View>
        );
    }

    // Type 1: Date (For now, text input with hints, or use specific component if available)
    // Mobile assumes Text for simplicity unless we import a DatePicker. 
    // Web uses date-time-picker for ID 1.
    // For now, let's treat as text but maybe add a date mask logic later if requested.

    // Type 2, 3: Numeric
    const isNumeric = TipoDatoID === 2 || TipoDatoID === 3 ||
        TipoCampo === 'Integer' || TipoCampo === 'Decimal' || TipoCampo === 'Number';

    // Type 5: TextArea
    const isTextArea = TipoDatoID === 5 || TipoCampo === 'Memo' || TipoCampo === 'TextoLargo';

    return (
        <CustomInput
            label={NombreVisual}
            required={Requerido}
            value={value}
            onChangeText={onChange}
            placeholder={Placeholder || (isNumeric ? "0" : `Ingrese ${NombreVisual.toLowerCase()}`)}
            keyboardType={isNumeric ? 'numeric' : 'default'}
            multiline={isTextArea}
            error={error}
        />
    );
};

const styles = StyleSheet.create({
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    labelContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.text,
    },
    required: {
        color: COLORS.danger,
        marginLeft: 4,
        fontSize: 14,
    },
});

export default DynamicField;
