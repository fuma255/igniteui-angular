import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IgxBadgeModule } from '../badge/badge.component';
import { IgxCheckboxModule } from '../checkbox/checkbox.component';
import { IgxSelectionAPIService } from '../core/selection';
import { IgxDatePickerModule } from '../date-picker/date-picker.component';
import { IgxButtonModule } from '../directives/button/button.directive';
import { IgxFocusModule } from '../directives/focus/focus.directive';
import { IgxForOfModule } from '../directives/for-of/for_of.directive';
import { IgxTemplateOutletModule } from '../directives/template-outlet/template_outlet.directive';
import { IgxRippleModule } from '../directives/ripple/ripple.directive';
import { IgxTextHighlightModule } from '../directives/text-highlight/text-highlight.directive';
import { IgxTextSelectionModule } from '../directives/text-selection/text-selection.directive';
import { IgxToggleModule } from '../directives/toggle/toggle.directive';
import { IgxDropDownModule } from '../drop-down/index';
import { IgxIconModule } from '../icon/index';
import { IgxInputGroupModule } from '../input-group/input-group.component';
import { IgxGridCellComponent } from './cell.component';
import { IgxColumnComponent, IgxColumnGroupComponent } from './column.component';
import { IgxColumnHidingModule } from './column-hiding.component';
import { IgxGridHeaderComponent } from './grid-header.component';
import { IgxGridToolbarComponent } from './grid-toolbar.component';
import { IgxGridFilteringCellComponent } from './filtering/grid-filtering-cell.component';
import { IgxGridFilteringRowComponent } from './filtering/grid-filtering-row.component';
import {
    IgxCellEditorTemplateDirective,
    IgxCellFooterTemplateDirective,
    IgxCellHeaderTemplateDirective,
    IgxCellTemplateDirective,
    IgxColumnResizerDirective,
    IgxColumnMovingDragDirective,
    IgxColumnMovingDropDirective,
    IgxColumnMovingService
} from './grid.common';
import { IgxGridTransaction } from './grid-base.component';
import { IgxRowComponent } from './row.component';
import { IgxChipsModule } from '../chips/chips.module';
import { IgxDragDropModule } from '../directives/dragdrop/dragdrop.directive';
import { IgxButtonGroupModule } from '../buttonGroup/buttonGroup.component';
import { IgxColumnPinningModule } from './column-pinning.component';
import { IgxBaseTransactionService } from '../services/transaction/base-transaction';
import {
    IgxRowEditTemplateDirective,
    IgxRowEditActionsDirective,
    IgxRowEditTextDirective,
    IgxRowEditTabStopDirective
} from './grid.rowEdit.directive';
import { IgxGridNavigationService } from './grid-navigation.service';
import { IgxGridHeaderGroupComponent } from './grid-header-group.component';
import { IgxColumnResizingService } from './grid-column-resizing.service';
import { IgxGridToolbarCustomContentDirective } from './grid-toolbar.component';
import { IgxSummaryRowComponent } from './summaries/summary-row.component';
import { IgxSummaryCellComponent } from './summaries/summary-cell.component';
import { IgxSummaryDataPipe } from './summaries/grid-root-summary.pipe';
import { IgxGridSummaryService } from './summaries/grid-summary.service';
import { IgxProgressBarModule } from '../progressbar/progressbar.component';
import { IgxFilterModule } from '../directives/filter/filter.directive';
import { IgxGridPipesModule } from './grid-pipes.module';
import { IgxGridExcelStyleFilteringModule } from './filtering/excel-style/grid.excel-style-filtering.module';
import { IgxGridColumnResizerComponent } from './grid-column-resizer.component';
/**
 * @hidden
 */
@NgModule({
    declarations: [
        IgxGridCellComponent,
        IgxColumnComponent,
        IgxColumnGroupComponent,
        IgxGridHeaderComponent,
        IgxGridToolbarComponent,
        IgxGridToolbarCustomContentDirective,
        IgxCellFooterTemplateDirective,
        IgxCellHeaderTemplateDirective,
        IgxCellEditorTemplateDirective,
        IgxCellTemplateDirective,
        IgxRowEditTemplateDirective,
        IgxRowEditActionsDirective,
        IgxRowEditTextDirective,
        IgxRowEditTabStopDirective,
        IgxColumnResizerDirective,
        IgxColumnMovingDragDirective,
        IgxColumnMovingDropDirective,
        IgxGridFilteringCellComponent,
        IgxGridFilteringRowComponent,
        IgxSummaryDataPipe,
        IgxRowComponent,
        IgxGridHeaderGroupComponent,
        IgxSummaryRowComponent,
        IgxSummaryCellComponent,
        IgxGridColumnResizerComponent
    ],
    entryComponents: [
        IgxColumnComponent,
        IgxColumnGroupComponent
    ],
    exports: [
        IgxGridCellComponent,
        IgxColumnComponent,
        IgxColumnGroupComponent,
        IgxGridHeaderComponent,
        IgxGridToolbarComponent,
        IgxGridToolbarCustomContentDirective,
        IgxCellFooterTemplateDirective,
        IgxCellHeaderTemplateDirective,
        IgxCellEditorTemplateDirective,
        IgxCellTemplateDirective,
        IgxRowEditTemplateDirective,
        IgxRowEditActionsDirective,
        IgxRowEditTextDirective,
        IgxRowEditTabStopDirective,
        IgxColumnResizerDirective,
        IgxColumnMovingDragDirective,
        IgxColumnMovingDropDirective,
        IgxRowComponent,
        IgxSummaryDataPipe,
        IgxButtonModule,
        IgxDatePickerModule,
        IgxIconModule,
        IgxRippleModule,
        IgxInputGroupModule,
        IgxToggleModule,
        IgxForOfModule,
        IgxTemplateOutletModule,
        IgxFocusModule,
        IgxTextHighlightModule,
        IgxTextSelectionModule,
        IgxCheckboxModule,
        IgxBadgeModule,
        IgxChipsModule,
        IgxDragDropModule,
        IgxColumnHidingModule,
        IgxDropDownModule,
        IgxButtonGroupModule,
        IgxColumnPinningModule,
        IgxProgressBarModule,
        IgxGridFilteringCellComponent,
        IgxGridFilteringRowComponent,
        IgxGridHeaderGroupComponent,
        IgxSummaryRowComponent,
        IgxSummaryCellComponent,
        IgxGridColumnResizerComponent,
        IgxFilterModule,
        IgxGridPipesModule,
        IgxGridExcelStyleFilteringModule
    ],
    imports: [
        CommonModule,
        FormsModule,
        IgxButtonModule,
        IgxDatePickerModule,
        IgxIconModule,
        IgxRippleModule,
        IgxInputGroupModule,
        IgxToggleModule,
        IgxForOfModule,
        IgxTemplateOutletModule,
        IgxFocusModule,
        IgxTextHighlightModule,
        IgxTextSelectionModule,
        IgxCheckboxModule,
        IgxBadgeModule,
        IgxChipsModule,
        IgxDragDropModule,
        IgxColumnHidingModule,
        IgxDropDownModule,
        IgxButtonGroupModule,
        IgxColumnPinningModule,
        IgxProgressBarModule,
        IgxFilterModule,
        IgxGridPipesModule,
        IgxGridExcelStyleFilteringModule
    ],
    providers: [
        IgxSelectionAPIService,
        IgxColumnMovingService,
        IgxGridNavigationService,
        IgxColumnResizingService,
        IgxGridSummaryService,
        { provide: IgxGridTransaction, useClass: IgxBaseTransactionService }
    ]
})
export class IgxGridCommonModule { }
