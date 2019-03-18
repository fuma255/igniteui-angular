import {
    EventEmitter,
    Output
} from '@angular/core';

import { cloneValue } from '../../core/utils';
import { DataUtil } from '../../data-operations/data-util';

import { ExportUtilities } from './export-utilities';
import { IgxExporterOptionsBase } from './exporter-options-base';
import { ITreeGridRecord } from '../../grids/tree-grid/tree-grid.interfaces';

/**
 * onRowExport event arguments
 * this.exporterService.onRowExport.subscribe((args: IRowExportingEventArgs) => {
 * // set args properties here
 * })
 */
export interface IRowExportingEventArgs {
    /**
     * Contains the exporting row data
     */
    rowData: any;

    /**
     * Contains the exporting row index
     */
    rowIndex: number;

    /**
     * Skip the exporting row when set to true
     */
    cancel: boolean;
}

/**
    * onColumnExport event arguments
    * ```typescript
    * this.exporterService.onColumnExport.subscribe((args: IColumnExportingEventArgs) => {
    * // set args properties here
    * });
    * ```
    */
export interface IColumnExportingEventArgs {
    /**
     * Contains the exporting column header
     */
    header: string;

    /**
     * Contains the exporting column field name
     */
    field: string;

    /**
     * Contains the exporting column index
     */
    columnIndex: number;

    /**
     * Skip the exporting column when set to true
     */
    cancel: boolean;

    /**
     * Export the column's data without applying its formatter, when set to true
     */
    skipFormatter: boolean;
}

export abstract class IgxBaseExporter {
    private _columnList: any[];
    private flatRecords = [];

    protected _isTreeGrid = false;
    protected _indexOfLastPinnedColumn = -1;
    protected _sort = null;

    /**
     * This event is emitted when a row is exported.
     * ```typescript
     * this.exporterService.onRowExport.subscribe((args: IRowExportingEventArgs) => {
     * // put event handler code here
     * });
     * ```
     * @memberof IgxBaseExporter
     */
    @Output()
    public onRowExport = new EventEmitter<IRowExportingEventArgs>();

    /**
     * This event is emitted when a column is exported.
     * ```typescript
     * this.exporterService.onColumnExport.subscribe((args: IColumnExportingEventArgs) => {
     * // put event handler code here
     * });
     * ```
     * @memberof IgxBaseExporter
     */
    @Output()
    public onColumnExport = new EventEmitter<IColumnExportingEventArgs>();

    /**
     * Method for exporting IgxGrid component's data.
     * ```typescript
     * this.exporterService.export(this.igxGridForExport, this.exportOptions);
     * ```
     * @memberof IgxBaseExporter
     */
    public export(grid: any, options: IgxExporterOptionsBase): void {
        if (options === undefined || options === null) {
            throw Error('No options provided!');
        }

        const columns = grid.columnList.toArray();
        this._columnList = new Array<any>(columns.length);

        const hiddenColumns = [];
        let lastVisbleColumnIndex = -1;

        columns.forEach((column) => {
            const columnHeader = column.header !== '' ? column.header : column.field;
            const exportColumn = !column.hidden || options.ignoreColumnsVisibility;
            const index = options.ignoreColumnsOrder ? column.index : column.visibleIndex;

            const columnInfo = {
                header: columnHeader,
                field: column.field,
                skip: !exportColumn,
                formatter: column.formatter,
                skipFormatter: false
            };

            if (index !== -1) {
                this._columnList[index] = columnInfo;
                lastVisbleColumnIndex = Math.max(lastVisbleColumnIndex, index);
            } else {
                hiddenColumns.push(columnInfo);
            }

            if (column.pinned && exportColumn) {
                this._indexOfLastPinnedColumn = index;
            }
        });

        // Append the hidden columns to the end of the list
        hiddenColumns.forEach((hiddenColumn) => {
            this._columnList[++lastVisbleColumnIndex] = hiddenColumn;
        });

        const data = this.prepareData(grid, options);
        this.exportData(data, options);
    }

    /**
     * Method for exporting any kind of array data.
     * ```typescript
     * this.exporterService.exportData(this.arrayForExport, this.exportOptions);
     * ```
     * @memberof IgxBaseExporter
     */
    public exportData(data: any[], options: IgxExporterOptionsBase): void {
        if (options === undefined || options === null) {
            throw Error('No options provided!');
        }

        if (!this._columnList || this._columnList.length === 0) {
            const keys = ExportUtilities.getKeysFromData(data);
            this._columnList = keys.map((k) => ({ header: k, field: k, skip: false }));
        }

        let skippedPinnedColumnsCount = 0;
        let columnsWithoutHeaderCount = 1;
        this._columnList.forEach((column, index) => {
            if (!column.skip) {
                const columnExportArgs = {
                    header: ExportUtilities.isNullOrWhitespaces(column.header) ?
                        'Column' + columnsWithoutHeaderCount++ : column.header,
                    field: column.field,
                    columnIndex: index,
                    cancel: false,
                    skipFormatter: false
                };
                this.onColumnExport.emit(columnExportArgs);

                column.header = columnExportArgs.header;
                column.skip = columnExportArgs.cancel;
                column.skipFormatter = columnExportArgs.skipFormatter;

                if (column.skip && index <= this._indexOfLastPinnedColumn) {
                    skippedPinnedColumnsCount++;
                }

                if (this._sort && this._sort.fieldName === column.field) {
                    if (column.skip) {
                        this._sort = null;
                    } else {
                        this._sort.fieldName = column.header;
                    }
                }
            }
        });

        this._indexOfLastPinnedColumn -= skippedPinnedColumnsCount;

        const dataToExport = new Array<any>();
        const isSpecialData = ExportUtilities.isSpecialData(data);

        data.forEach((row, index) => {
            this.exportRow(dataToExport, row, index, isSpecialData);
        });

        this.exportDataImplementation(dataToExport, options);
        this.resetDefaults();
    }

    protected abstract exportDataImplementation(data: any[], options: IgxExporterOptionsBase): void;

    private exportRow(data: any[], rowData: any, index: number, isSpecialData: boolean) {
        let row;

        if (!isSpecialData) {
            row = this._columnList.reduce((a, e) => {
                if (!e.skip) {
                    const rawValue = this._isTreeGrid ? rowData.data[e.field] : rowData[e.field];
                    a[e.header] = e.formatter && !e.skipFormatter ? e.formatter(rawValue) : rawValue;
                }
                return a;
            }, {});
        } else {
            row = this._isTreeGrid ? rowData.data : rowData;
        }

        const rowArgs = {
            rowData: row,
            rowIndex: index,
            cancel: false
        };
        this.onRowExport.emit(rowArgs);

        if (!rowArgs.cancel) {
            data.push({ rowData: rowArgs.rowData, originalRowData: rowData });
        }
    }

    private prepareData(grid: any, options: IgxExporterOptionsBase): any[] {
        this.flatRecords = [];
        let rootRecords = grid.rootRecords;
        this._isTreeGrid = rootRecords !== undefined;

        if (this._isTreeGrid) {
            this.prepareHierarchicalData(rootRecords);
        }

        let data = this._isTreeGrid ? this.flatRecords : grid.data;

        if (grid.filteringExpressionsTree &&
            grid.filteringExpressionsTree.filteringOperands.length > 0 &&
            !options.ignoreFiltering) {
            const filteringState = {
                expressionsTree: grid.filteringExpressionsTree,
                logic: grid.filteringLogic
            };

            if (this._isTreeGrid) {
                this.flatRecords = [];
                rootRecords = DataUtil.treeGridFilter(rootRecords, filteringState);
                this.prepareHierarchicalData(rootRecords);
                data = this.flatRecords;
            } else {
                data = DataUtil.filter(data, filteringState);
            }
        }

        if (grid.sortingExpressions &&
            grid.sortingExpressions.length > 0 &&
            !options.ignoreSorting) {
            this._sort = cloneValue(grid.sortingExpressions[0]);

            if (this._isTreeGrid) {
                this.flatRecords = [];
                rootRecords = DataUtil.treeGridSort(rootRecords, grid.sortingExpressions);
                this.prepareHierarchicalData(rootRecords);
                data = this.flatRecords;
            } else {
                data = DataUtil.sort(data, grid.sortingExpressions);
            }
        }

        return data;
    }

    private prepareHierarchicalData(records: ITreeGridRecord[]) {
        if (!records) {
            return;
        }
        for (let i = 0; i < records.length; i++) {
            const hierarchicalRecord = records[i];

            this.flatRecords.push(hierarchicalRecord);
            this.prepareHierarchicalData(hierarchicalRecord.children);
        }
    }

    private resetDefaults() {
        this._columnList = [];
        this._indexOfLastPinnedColumn = -1;
        this._sort = null;
        this.flatRecords = [];
    }
}
